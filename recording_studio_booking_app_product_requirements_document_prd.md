# Recording Studio Booking App — Product Requirements Document (PRD)

_Last updated: 2025-11-02_

---

## 0) Purpose

Build a production-ready web application for a recording studio to accept and manage client bookings. This PRD turns high-level goals into concrete specs that map directly to database schema, API contracts, UI flows, and implementation tasks—optimized for a Next.js (App Router, TypeScript) + Tailwind + shadcn/ui stack.

---

## 1) Goals & Non‑Goals

### Goals

- Let artists **discover availability**, **book**, and **pay** for sessions (self-serve).
- Give studio staff an **admin app** to manage rooms, staff, availability rules, holds, bookings, and payouts.
- **Prevent double-bookings** across rooms and staff; enforce business rules (buffers, lead times, cancellation windows).
- **Sync** bookings to Google Calendar / Outlook for staff, and support **Apple Calendar** via **ICS feeds and .ics invites**.
- Provide **notifications** (email/SMS) and **receipts**.
- Support near **real-time availability** updates.
- Introduce an **approval workflow**: bookings require admin approval before appearing on any calendar.

### Non-Goals (v1)

- Marketplace across multiple studios.
- Native mobile apps (mobile web first).
- Complex promotions/coupons (simple promo code can be v1.1).
- Multi-currency pricing (CAD only in v1 unless otherwise noted).

---

## 2) Personas

- **Artist/Client**: books time, pays, reschedules/cancels within policy.
- **Engineer/Producer (Staff)**: assigned to sessions, sets availability; views personal calendar.
- **Studio Manager/Admin**: manages rooms, pricing, staff, exceptions, payouts; overrides bookings.
- **Owner**: views reports/analytics.

---

## 3) User Stories (Key)

### Artist

1. As an artist, I can browse available **rooms** and **time slots** filtered by date, duration, and required staff skill.
2. I can see a **price quote** before paying, including taxes, fees, buffers.
3. I can **book** and **pay a deposit** or full amount securely.
4. I receive **submission confirmation** immediately and a follow-up **approval email** (with **.ics calendar invite**) when approved.
5. I can **reschedule** or **cancel** within studio policy and see fees/refunds instantly.
6. I can view **upcoming** and **past bookings** and **download receipts**.

### Staff

7. As staff, I can set **working hours**, breaks, and **exceptions**.
8. I get sessions **auto-synced** to my Google/Outlook; for **Apple Calendar** I can **subscribe to a secure ICS feed** of my assignments.
9. I can **swap/assign** engineers (admin permission).

### Admin

10. As admin, I can CRUD **rooms**, **services**, **pricing**, **buffers**, **policies**.
11. I can place **soft holds** that expire automatically.
12. I can view a **calendar board** by room and staff, with conflict warnings.
13. I can **approve or reject** submitted bookings, optionally adding an internal note and a customer-facing message.
14. I can issue **refunds/partial refunds** and export **payout reports**.
15. I can configure **integrations** (Stripe, Google, Outlook, Apple via ICS, Resend/Twilio).

---

## 4) Success Metrics (v1)

- TTFB < 300ms for availability search (cached rules + indexed queries).
- 0 double-booking incidents in normal operation (verified by tests/observability).
- 90% bookings with calendar sync success (<10 min delay; ideal <1 min).
- <0.5% payment failures due to app issues (excluding card declines).
- NPS ≥ +30 for artists after first booking.

---

## 5) System Overview

- **Public Client App**: Next.js (App Router) SSR/ISR + client hydration.
- **Admin App**: Same Next.js project, role-gated routes.
- **Backend**: Next.js Route Handlers + Server Actions for mutations. Optional worker for webhooks/async jobs.
- **DB**: Postgres (e.g., Neon/Supabase). Row-Level locks for booking; unique constraints.
- **Cache/Queue**: Redis for short-lived holds & rate limits. Queue (e.g., Cloudflare Queues/Upstash/QStash) for async tasks.
- **Payments**: Stripe (Payment Intents).
- **Calendars**: Google Calendar (OAuth/Service account), Microsoft Graph.
- **Notifications**: Resend (email) + Twilio (SMS).
- **Real-time**: Ably/Pusher or Postgres LISTEN/NOTIFY → websockets/SSE channel for availability updates.

---

## 6) Domain Model (ERD-level)

**Entities**

- **User**(id, email, phone, name, role: [artist, staff, admin], password_hash? or OAuth, marketing_opt_in, created_at)
- **Staff**(id, user_id FK, skills[], default_calendar_provider, google_calendar_id, outlook_calendar_id, hourly_rate, active)
- **Room**(id, name, description, capacity, tags[], equipment[], color, active)
- **Service**(id, name, description, default_duration_min, base_price_cents, requires_engineer bool, room_tags[], staff_skill_required?)
- **ScheduleRule**(id, target_type: [room, staff, studio], target_id, byweekday[], start_time, end_time, timezone, effective_from, effective_to)
- **Exception/Blackout**(id, target_type, target_id, start_at, end_at, reason)
- **BufferRule**(id, scope: [room, service, staff], before_min, after_min)
- **Booking**(id, code, user_id, room_id, status: [pending, held, confirmed, completed, canceled], start_at, end_at, source: [web, admin], notes, created_at)
- **BookingStaff**(booking_id, staff_id, role: [engineer, assistant]) — M:N
- **BookingService**(booking_id, service_id, quantity, unit_price_cents, total_cents)
- **Hold**(id, user_id, room_id, start_at, end_at, expires_at, token, status: [active, expired, converted])
- **Payment**(id, booking_id, amount_cents, currency, stripe_payment_intent_id, status: [requires_payment_method, succeeded, canceled, refunded, partial_refunded], captured_at)
- **Refund**(id, payment_id, amount_cents, stripe_refund_id, status, created_at)
- **CalendarSync**(id, booking_id, provider, external_event_id, status: [pending, synced, failed], last_attempt_at, error)
- **Notification**(id, user_id, booking_id?, channel: [email, sms], template, payload_json, status, error, sent_at)
- **AuditLog**(id, actor_user_id, action, entity, entity_id, diff_json, created_at)
- **WebhookEndpoint**(id, url, secret, active)
- **WebhookEvent**(id, type, payload_json, delivered_at, status)

**Indexes/Constraints**

- `booking_unique_overlap`: prevent overlaps per (room_id, time range). Implement via **exclusion constraint** (Postgres `gist` + `tstzrange`) or transactional lock + check.
- Unique per staff/time overlap across `BookingStaff`.
- Unique booking `code` (human-friendly).

---

## 7) Business Rules

1. **Availability** = Room availability ∩ Staff availability (if service requires engineer) ∩ Studio hours − (Blackouts + Existing bookings + Buffers).
2. **Buffers**: configurable per service/staff/room (setup/teardown). Before_min and after_min block time.
3. **Lead times**: min time before start to book (e.g., 2 hours), and max horizon (e.g., 90 days).
4. **Durations**: booking durations are multiples of service default, editable by admin.
5. **Pricing**: base_price + add-ons (services) × quantity; taxes & fees calculated server-side.
6. **Deposits**: optional percentage (e.g., 25%). Remaining due auto-charged X hours before session or on-site.
7. **Approval Workflow**: Submitted bookings enter **`awaiting_approval`** state. Only **approved** bookings transition to **`confirmed`** and are eligible for calendar sync and customer confirmation email.
8. **Payment Capture Timing**: When approval is required, Stripe PI uses **`capture_method = 'manual'`** (auth-only). On approval → **capture**; on rejection → **cancel** PI or **refund** if already captured (configurable).
9. **Cancellation Policy**: e.g., >48h full refund; 24–48h 50%; <24h no refund. Policy stored centrally and evaluated at action time.
10. **Reschedule Policy**: allow once for free >24h; otherwise fee.
11. **Holds**: 10–20 min expires automatically; converts to booking on successful payment intent creation.
12. **Conflicts**: system must block booking if **any** assigned staff or room conflict exists.
13. **Admin Overrides**: admin can override conflicts with explicit warning + audit log.
14. **Calendar Sync**: Google/Outlook events **and Apple Calendar** feeds are only produced for **approved/confirmed** bookings. Staff ICS feeds update within 1–5 minutes.

---

## 8) API Contracts (HTTP JSON, Next.js Route Handlers)

**Auth**

- `POST /api/auth/register` {email, password, name}
- `POST /api/auth/login` {email, password}
- `POST /api/auth/logout`
- `GET /api/auth/session` → {user}

**Public Availability**

- `GET /api/rooms` → list rooms
- `GET /api/services` → list services
- `POST /api/availability/search` {date, duration_min, service_id?, room_id?, staff_skill?}
  - → {slots: [{start_at, end_at, room_id, price_cents}]}
- `POST /api/quote` {room_id, service_id, start_at, duration_min, staff_ids?}
  - → {subtotal_cents, taxes_cents, total_cents, deposit_cents, policy_summary}
- `POST /api/holds` {room_id, start_at, end_at} → {hold_id, expires_at}

**Booking Flow**

- `POST /api/bookings` {hold_id?, room_id, service_items: [{service_id, qty}], start_at, end_at, notes?, staff_ids?}
  - Validates + creates booking in **`awaiting_approval`** and returns `booking_id`, `client_secret` (Stripe PI with manual capture when configured)
- `GET /api/bookings/:id` → booking detail (+ services, payments)
- `POST /api/bookings/:id/reschedule` {new_start_at, new_end_at}
- `POST /api/bookings/:id/cancel` {reason}
- `GET /api/me/bookings` → upcoming/past for artist

**Admin**

- `GET /api/admin/calendar?from&to&groupBy=room|staff`
- CRUD: `/api/admin/rooms`, `/api/admin/services`, `/api/admin/staff`, `/api/admin/schedule-rules`, `/api/admin/exceptions`, `/api/admin/buffers`
- `POST /api/admin/bookings/:id/approve` {message?}
  - Side effects: capture payment (if manual), send approval email (with .ics), enqueue calendar sync, publish real-time updates.
- `POST /api/admin/bookings/:id/reject` {reason}
  - Side effects: cancel PI or refund, send rejection email, release holds.
- `POST /api/admin/bookings/:id/assign-staff` {staff_ids}
- `POST /api/admin/bookings/:id/refund` {amount_cents}
- Integrations:
  - `POST /api/admin/integrations/stripe/connect`
  - `POST /api/admin/integrations/google/oauth`
  - `POST /api/admin/integrations/outlook/oauth`

**Calendar & ICS**

- `GET /api/calendar/ics/booking/:code.ics` → single-event ICS for artists (tokenized)
- `GET /api/calendar/ics/staff/:staff_id.ics?token=...` → staff subscription feed (read-only, rolling window +/- 180 days)

**Notifications**

- `POST /api/notifications/test` {channel}

**Idempotency**: All mutation endpoints accept `Idempotency-Key` header.

---

## 9) Data Schema (SQL-ish)

```sql
-- users
CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('artist','staff','admin')),
  marketing_opt_in boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- staff
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id) UNIQUE,
  skills text[] DEFAULT '{}',
  default_calendar_provider text CHECK (default_calendar_provider IN ('google','outlook','apple')),
  google_calendar_id text,
  outlook_calendar_id text,
  ics_token text UNIQUE, -- for secure feed URLs
  hourly_rate_cents integer,
  active boolean DEFAULT true
);

-- rooms
CREATE TABLE room (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  capacity int,
  tags text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  color text,
  active boolean DEFAULT true
);

-- services
CREATE TABLE service (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_duration_min int NOT NULL,
  base_price_cents int NOT NULL,
  requires_engineer boolean DEFAULT false,
  room_tags text[] DEFAULT '{}',
  staff_skill_required text
);

-- schedule rules (weekly)
CREATE TABLE schedule_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text CHECK (target_type IN ('room','staff','studio')),
  target_id uuid,
  byweekday int[] NOT NULL, -- 0=Sun..6=Sat
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL,
  effective_from date,
  effective_to date
);

-- exceptions/blackouts
CREATE TABLE exception (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text CHECK (target_type IN ('room','staff','studio')),
  target_id uuid,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text
);

-- buffers
CREATE TABLE buffer_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text CHECK (scope IN ('room','service','staff')),
  target_id uuid,
  before_min int DEFAULT 0,
  after_min int DEFAULT 0
);

-- bookings
CREATE TABLE booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  user_id uuid REFERENCES app_user(id),
  room_id uuid REFERENCES room(id),
  status text CHECK (status IN ('awaiting_approval','confirmed','completed','canceled','rejected')) NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  source text CHECK (source IN ('web','admin')) DEFAULT 'web',
  notes text,
  approved_by uuid REFERENCES app_user(id),
  approved_at timestamptz,
  approval_note text,
  created_at timestamptz DEFAULT now()
);

-- booking services
CREATE TABLE booking_service (
  booking_id uuid REFERENCES booking(id) ON DELETE CASCADE,
  service_id uuid REFERENCES service(id),
  quantity int NOT NULL DEFAULT 1,
  unit_price_cents int NOT NULL,
  total_cents int NOT NULL,
  PRIMARY KEY (booking_id, service_id)
);

-- booking staff assignments
CREATE TABLE booking_staff (
  booking_id uuid REFERENCES booking(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id),
  role text CHECK (role IN ('engineer','assistant')),
  PRIMARY KEY (booking_id, staff_id)
);

-- payments
CREATE TABLE payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES booking(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'CAD',
  stripe_payment_intent_id text UNIQUE,
  capture_method text DEFAULT 'automatic', -- 'manual' for approval flow
  status text NOT NULL,
  captured_at timestamptz
);

-- refunds
CREATE TABLE refund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payment(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,
  stripe_refund_id text UNIQUE,
  status text,
  created_at timestamptz DEFAULT now()
);

-- holds
CREATE TABLE hold (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id),
  room_id uuid REFERENCES room(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  token text UNIQUE NOT NULL,
  status text CHECK (status IN ('active','expired','converted')) DEFAULT 'active'
);

-- calendar sync
CREATE TABLE calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES booking(id) ON DELETE CASCADE,
  provider text CHECK (provider IN ('google','outlook','apple_ics')),
  external_event_id text,
  status text,
  last_attempt_at timestamptz,
  error text
);

-- notifications
CREATE TABLE notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id),
  booking_id uuid REFERENCES booking(id),
  channel text CHECK (channel IN ('email','sms')),
  template text,
  payload_json jsonb,
  status text,
  error text,
  sent_at timestamptz
);
```

**Overlap Protection (Postgres example)**

```sql
-- Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping bookings for the same room
ALTER TABLE booking ADD COLUMN during tstzrange GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;
CREATE INDEX IF NOT EXISTS booking_room_during_idx ON booking USING gist (room_id, during);
ALTER TABLE booking ADD CONSTRAINT no_room_overlap EXCLUDE USING gist (
  room_id WITH =,
  during WITH &&
) WHERE (status IN ('awaiting_approval','confirmed'));
```

**Overlap Protection (Postgres example)**

```sql
-- Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping bookings for the same room
ALTER TABLE booking ADD COLUMN during tstzrange GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;
CREATE INDEX IF NOT EXISTS booking_room_during_idx ON booking USING gist (room_id, during);
ALTER TABLE booking ADD CONSTRAINT no_room_overlap EXCLUDE USING gist (
  room_id WITH =,
  during WITH &&
) WHERE (status IN ('pending','confirmed'));
```

---

## 10) Availability Engine (Algorithm)

1. Build **working windows** from `ScheduleRule` (studio ∩ room ∩ staff if required) for the query day.
2. Subtract **exceptions/blackouts**.
3. Subtract **existing bookings** + **buffers** (before/after) for room and staff.
4. Slice into slot sizes: `max(service.default_duration_min, requested_duration)` respecting step = 15 min.
5. Price each slot (base + add-ons, time-based adjustments if configured).
6. Cache deterministic steps by day/room/service; invalidate on writes.

**Real-time**: Use Redis locks for hold/commit; pushes to channel `availability:room:{id}` when holds/bookings change.

---

## 11) Payments & Policies

- **Processor**: Stripe Payment Intents; store only PI IDs.
- **Approval-aware Capture**: For bookings needing approval, create PI with `capture_method = 'manual'`. On approval capture; on rejection cancel/refund. For instant-approve items, default to automatic capture.
- **Deposit**: percentage configurable; remaining auto-capture X hours before start (background job). Deposits may still use manual capture.
- **Refunds**: derive from cancellation policy; support partial refunds.
- **Receipts**: email via Resend; PDF link optional (generated server-side).

---

## 12) Calendar Integrations

- **Google**: OAuth per staff; scope `calendar.events`. Create/update/delete events **only after approval** with booking code + room name. Add artist email as guest (optional).
- **Outlook**: Microsoft Graph similar flow.
- **Apple Calendar**: via **ICS**:
  - **Single-event .ics**: generated on approval and attached to the approval email for artists.
  - **Staff ICS feed**: secure tokenized URL per staff; Apple Calendar can **Subscribe** to feed for near real-time updates (read-only). Regenerate token to revoke.
- **Resilience**: queue retries with exponential backoff; mark `CalendarSync.status` and surface failures in Admin UI.

---

## 13) Notifications (Templates)

- **Booking Submitted** (email): acknowledges receipt; states that approval is pending.
- **Booking Approved** (email/SMS): includes summary and **.ics** attachment + "Add to Calendar" links (Google, Outlook, Apple via ICS).
- **Booking Rejected** (email): reason + refund info if applicable.
- **Reminder** (24h before)
- **Rescheduled**
- **Canceled/Refunded**
- **Payment Failed / Action Needed**

Template vars: {artist_name, booking_code, room_name, date, start_time, end_time, total, deposit, address, policies_url}.

---

## 14) Security & Compliance

- Auth: NextAuth (email/password + OAuth optional). Sessions via JWT or cookies.
- RBAC: server-side checks per route handler; never rely on client.
- Input validation: Zod schemas for all payloads.
- Rate limits: per IP and per user on booking/payment endpoints.
- Idempotency: `Idempotency-Key` header stored in Redis to dedupe.
- PII: encrypt sensitive columns (phone) at rest.
- Payments: PCI handled by Stripe Elements; never touch raw card data.
- AuditLog for all admin overrides.

---

## 15) Observability

- Structured logs with request IDs.
- Metrics: bookings/day, conversion, payment success rate, availability search latency, calendar sync failures.
- Error tracking (Sentry).

---

## 16) Frontend UX Specs

### Public (Artist)

- **/ (Home)**: hero, room cards, CTA to "Check Availability".
- **/availability**: date picker, duration selector, service, room filter; grid timeline of slots; clicking a slot opens booking drawer.
- **/book**: summary, add-ons, policy acknowledgement checkbox, payment element.
  - After submit: **Success (Submission)** screen explains "pending approval" status and expected email timeline.
- **/me/bookings**: tabs Upcoming/Past; show **status chips**: Awaiting Approval, Confirmed, Canceled, Rejected; actions: reschedule/cancel (policy-gated).
- **/receipt/[code]**: printable receipt (available after approval or always, configurable).

### Admin

- **/admin/calendar**: Room view & Staff view (week/day). Drag to create hold; indicators for conflicts/sync status.
- **/admin/bookings**: table with filters; **Approval queue** tab showing `awaiting_approval` newest first, bulk approve/reject with notes.
- **/admin/rooms**: CRUD rooms & equipment.
- **/admin/services**: CRUD services, durations, pricing.
- **/admin/staff**: manage skills, calendars, working hours, OAuth status, **ICS token rotate**.
- **/admin/settings**: policies, buffers, deposits, integrations, **Approval & capture settings**.
- **/admin/reports**: revenue, utilization, top services.

**Empty/Loading/Error States** for each page with guidance messaging.

---

## 17) Next.js Project Structure (App Router)

```
app/
  (public)/
    page.tsx
    availability/
      page.tsx
    book/
      page.tsx
    me/
      bookings/page.tsx
  admin/
    layout.tsx
    calendar/page.tsx
    bookings/page.tsx
    rooms/page.tsx
    services/page.tsx
    staff/page.tsx
    settings/page.tsx
    reports/page.tsx
  api/
    availability/search/route.ts
    quote/route.ts
    bookings/route.ts
    bookings/[id]/route.ts
    bookings/[id]/reschedule/route.ts
    bookings/[id]/cancel/route.ts
    holds/route.ts
    payments/intent/route.ts
    webhooks/stripe/route.ts
    admin/... (CRUD routes)
lib/
  db.ts  (Prisma client)
  auth.ts (NextAuth)
  pricing.ts
  availability.ts
  policies.ts
  notifications.ts
  calendar.ts
  realtime.ts
prisma/
  schema.prisma
components/
  ui/* (shadcn)
  booking/*
  admin/*
```

---

## 18) Edge Cases & Error Handling

- Payment succeeds but webhook delayed → show "processing" state; poll PI status.
- Calendar event creation fails → booking remains confirmed; show sync warning; retry.
- Race: two users attempt same slot → first PI confirmation wins; second sees slot unavailable; refund/void intent.
- Daylight Savings transitions → store in UTC, render in studio TZ.
- Staff removal when assigned → block or reassign before deactivation.
- Partial service durations that collide with buffers → snap to next valid time.

---

## 19) Acceptance Criteria (High-level)

1. Artist can search, book (submission), and receive a **pending approval** acknowledgment.
2. Admin can approve/reject; on approval the system captures payment (if manual), syncs calendars (Google/Outlook/Apple ICS), and sends **approval email with .ics**.
3. No double-booking under heavy concurrent requests (tested).
4. Stripe webhooks update booking/payment status reliably; refunds flow works on rejection.
5. Google/Outlook events and Apple ICS feeds update within 1–5 minutes of approval (best effort).
6. Notifications sent for submission, approval, reminders, reschedules, cancellations.

---

## 20) QA Test Plan (Representative)

- **Unit**: pricing calc, buffer application, overlap detector, **status machine** (awaiting_approval → confirmed/rejected), ICS generator.
- **Integration**: availability search with overlapping rules; booking with manual capture; approval triggers capture + ICS email; rejection triggers cancellation/refund.
- **E2E (Playwright)**: guest books 2h session with engineer → sees pending screen; admin approves → user receives email with .ics; Apple Calendar subscription shows event; reschedule path re-sends updated .ics and updates feeds.
- **Load**: 500 rps availability search; 50 concurrent checkout attempts for same slot (should yield 1 success, 49 failures gracefully).

---

## 21) Milestones & Build Order

- **M0 — Project Bootstrap (1–2d)**: Next.js, Tailwind, shadcn, Prisma, Stripe test keys, auth scaffold.
- **M1 — Admin Foundations (1–2w)**: Rooms/Services CRUD; ScheduleRules & Exceptions; Buffers; Admin Calendar view (read-only); seed data.
- **M2 — Availability & Booking (2w)**: Availability search, holds, booking creation, pricing, Stripe checkout, notifications.
- **M3 — Staff & Sync (1–2w)**: Staff profiles, skills, working hours, Google/Outlook OAuth + sync worker.
- **M4 — Polishing (1w)**: Reschedule/Cancel policies, receipts, reports, accessibility, error states, analytics.

---

## 22) Implementation Notes

- Prefer **server actions** for mutations with optimistic UI.
- Use **Zod** for runtime validation and Prisma types for compile-time safety.
- Date math via **luxon** or **date-fns-tz**; always convert to UTC at the boundary.
- **Prisma**: model `Booking` with computed `during` range; use transactions with `Serializable` isolation for creation.
- Caching: computed availability per room/day keyed by rules hash; invalidate on booking/exception changes.
- Real-time: Ably/Pusher channel `availability:room:{id}`; publish on hold/booking events.

---

## 23) Open Questions (for later)

- Tiered pricing (peak/off-peak) — v1.1
- Packages (10-hour bundles) — v1.2
- Gift cards — v1.2
- Multi-currency & taxes by region — v2

---

## 24) Glossary

- **Hold**: temporary reserved period pending payment.
- **Buffer**: unbookable time added before/after a session.
- **Exception/Blackout**: explicit unavailability window.
- **Policy**: studio-defined rules for cancellation/reschedule.

---

## 25) Quick Start Checklist (Dev)

- [ ] Create Next.js app with TypeScript, Tailwind, shadcn/ui.
- [ ] Add Prisma + Postgres schema above; run migrations; seed.
- [ ] Implement availability engine and `/api/availability/search`.
- [ ] Implement booking flow: hold → booking → payment intent → webhook → confirm.
- [ ] Build public pages and admin dashboard skeleton.
- [ ] Integrate Stripe, Resend, Twilio; wire templates.
- [ ] Add Google/Outlook OAuth + sync worker.
- [ ] Add tests (unit/integration/E2E) + CI.
