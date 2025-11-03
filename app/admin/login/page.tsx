"use client";

import Header from "@/components/Header";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Default admin credentials (in production, this would be handled by a backend)
  const ADMIN_EMAIL = "admin@bettersounds.com";
  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Store admin session
      if (typeof window !== "undefined") {
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminEmail", email);
      }
      router.push("/admin/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-black mb-6 text-center">
            Admin Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-black text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="admin@bettersounds.com"
                required
              />
            </div>

            <div>
              <label className="block text-black text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Email: {ADMIN_EMAIL}</p>
            <p>Password: {ADMIN_PASSWORD}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

