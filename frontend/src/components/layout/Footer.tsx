'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Logo } from '../ui/Logo';

/** Current X (Twitter) mark — Lucide still ships the legacy bird icon. */
function XSocialIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle"></div>
          {isMounted && (
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
          )}
        </div>
      </div>

      <div className="container-modern relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <Logo size="lg"  className="text-white" />
            </div>
            <p className="text-gray-400 mb-6 max-w-md text-lg leading-relaxed">
              Your complete wedding planning platform. Connect with vendors, manage guests, 
              and create the wedding of your dreams with our modern, intuitive tools.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.facebook.com/share/17xtayxYDc/"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors duration-300 hover:bg-white/10 hover:text-[#1877F2] hover-scale"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </a>
              <a
                href="https://www.instagram.com/idealweddingszw?igsh=Y3hsZmx1bGl1em4x"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors duration-300 hover:bg-white/10 hover:text-[#E4405F] hover-scale"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </a>
              <a
                href="https://x.com/IdealWeddingszw"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors duration-300 hover:bg-white/10 hover:text-white hover-scale"
              >
                <span className="sr-only">X</span>
                <XSocialIcon className="h-[1.35rem] w-[1.35rem]" />
              </a>
              <a
                href="#"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors duration-300 hover:bg-white/10 hover:text-[#0A66C2] hover-scale"
              >
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://idealweddings.co.zw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                >
                  Wedding Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter signup */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h4 className="text-lg font-bold mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 mb-4">Get wedding planning tips and vendor updates delivered to your inbox.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              {isMounted && (
                <button 
                  type="button"
                  className="btn-primary btn-md"
                  onClick={() => {
                    // Handle newsletter subscription
                    console.log('Newsletter subscription clicked');
                  }}
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Ideal Weddings. All rights reserved. Made with 💕 for couples worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
