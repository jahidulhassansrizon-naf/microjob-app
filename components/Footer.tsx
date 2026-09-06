import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B101D] text-gray-300 font-sans relative overflow-hidden">
      {/* Top Colorful Gradient Border Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF5100] via-[#E1007E] to-[#8000FF]" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-16 pb-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16">
          {/* Column 1: Logo & Contact Info */}
          <div className="lg:col-span-2 space-y-6 pr-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#FF5D00] rounded-lg flex items-center justify-center font-black text-white text-lg tracking-wider">
                SK
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tight text-white">
                  Sohoz<span className="text-[#FF5D00]">kaj</span>
                </span>
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase">
                  WWW.SOHOZKAJ.COM
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              SohozKaj Platform — document creation, design, print media, and AI
              tools — all in one place.
            </p>

            <div className="space-y-3 pt-2 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#FF5D00] shrink-0" />
                <span>hello@sohozkaj.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#FF5D00] shrink-0" />
                <span>+88 01700-559595</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-[#FF5D00] shrink-0" />
                <span>1995/2 Latifpur, Moddhopara, Bogura 5800</span>
              </div>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className="text-white font-bold text-base mb-5 tracking-wide">
              Services
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li>
                <a href="#" className="hover:text-white transition">
                  AI Photo Edit
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Manual Photo Edit
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Bulk Photo Edit
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  AI Photo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Document Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Print Media
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Create Questions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Job Circular
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  SohozTools
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Pages */}
          <div>
            <h3 className="text-white font-bold text-base mb-5 tracking-wide">
              Pages
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li>
                <a href="#" className="hover:text-white transition">
                  What is SohozKaj?
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Our Team
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Important Articles
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Document Templates
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  AI Photo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Package
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Contest
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className="text-white font-bold text-base mb-5 tracking-wide">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li>
                <a href="#" className="hover:text-white transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Copyright Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 mb-8">
          <p>© 2026 SohozKaj. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-gray-800/70 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-gray-800/70 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.56-1.28 2.56.02.82.42 1.61 1.08 2.1 1.05.82 2.57.85 3.65.08.73-.5 1.17-1.33 1.25-2.22.08-2.37.03-4.75.03-7.12 0-3.37-.02-6.75.02-10.12z" />
              </svg>
            </a>

            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-gray-800/70 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Container-aligned Payment Gateway Strip */}
        <div className="w-full bg-white rounded flex justify-center items-center overflow-hidden py-1">
          <img
            src="https://files.sohozkaj.com/SSLCommerz-Pay-With-logo.webp"
            alt="Payment Options (SSLCommerz)"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
