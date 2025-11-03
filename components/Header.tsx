"use client";

export default function Header() {
  return (
    <>
      {/* Red Header Bar */}
      <div className="w-full bg-[#DC2626] px-4 -my-5 flex  justify-end lg:-my-5">
        {/* Hamburger Menu */}
        <button
          className="text-white hover:opacity-80 transition-opacity lg:hidden"
          aria-label="Menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect y="4" width="24" height="2" fill="currentColor" />
            <rect y="11" width="24" height="2" fill="currentColor" />
            <rect y="18" width="24" height="2" fill="currentColor" />
          </svg>
        </button>
        <a href="/" className="lg:mx-auto">
          <img
            src="/assets/images/BSR_Logo.PNG"
            alt="Better Sounds Logo"
            className="lg:h-48 lg:w-96"
          />
        </a>
      </div>

      {/* Location and Title Section - Dark Background */}
      <div className="w-full bg-black py-4 px-4 text-center">
        {/* Location Text - Smaller, pixelated style */}
        <p className="text-white text-xs sm:text-sm mb-2 pixelated">
          LOCATION: DOWNTOWN LOS ANGELES
        </p>
        {/* Main Title - Larger, pixelated style */}
        <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold pixelated">
          BOOKING AT BETTER SOUNDS
        </h1>
      </div>
    </>
  );
}
