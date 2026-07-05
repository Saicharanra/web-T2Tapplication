"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 border-t border-gray-200 mt-16">
      {/* Footer main content */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">

        {/* Brand Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center md:justify-start">
         <div>
            <Image
              src={logo}
              alt="Trash2Treasure"
              className="h-7 w-auto"
            />
          </div>
             <span className={`${poppins.className} font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400`}>
  Trash2Treasure
</span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
            Transforming waste into rewards while building a cleaner, greener, and more rewarding future. 🌱
          </p>

          {/* Social Media */}
          <div className="flex justify-center md:justify-start gap-4 mt-4">
            {[
              { icon: <Facebook size={20} />, link: "https://www.facebook.com/t2tindia" },
              { icon: <Instagram size={20} />, link: "https://www.instagram.com/t2t_india?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
              { icon: <Twitter size={20} />, link: "https://x.com/t2t_india" },
              { icon: <Linkedin size={20} />, link: "https://www.linkedin.com/in/trash-2-treasure-2614223b3" },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.link}
                target="_blank"
                className="p-2 rounded-full bg-white shadow hover:bg-green-100 text-green-700 transition-all"
                whileHover={{ scale: 1.1 }}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-600">
            {[
              { name: "Home", href: "/" },
              { name: "Scan & Earn", href: "/dashboard/scan" },
              { name: "Rewards", href: "/dashboard/reward" },
              { name: "Dashboard", href: "/dashboard/wallet" },
            ].map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="hover:text-green-600 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Support Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Support</h4>
          <ul className="space-y-2 text-gray-600">
            {[
              { name: "Help Center", href: "/help" },
              { name: "Privacy Policy", href: "/privacy" },
              { name: "Terms of Service", href: "/terms" },
              { name: "Download App", href: "#" },
            ].map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Bottom Note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center py-5 text-gray-500 text-sm"
      >
        © 2026 <span className="font-semibold text-green-600">Trash2Treasure</span>. All rights reserved.
      </motion.div>

      {/* Background Glow Effect */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-green-300/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-16 -left-24 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
    </footer>
  );
}
