"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, Coins, Leaf } from "lucide-react";
import binsImg from "@/assets/Dust.png";
import { motion } from "framer-motion";
import Footer from "../footer/page"; // import Footer as a component (capitalize for React components)

export default function Homepage() {
  return (
    <>
      <section className="w-full px-0 md:px-4 bg-gradient-subtle min-h-screen flex flex-col">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col-reverse md:flex-row items-center justify-between rounded-3xl bg-glass p-6 md:p-14 gap-10 border border-white/50 mt-8 md:mt-12 overflow-hidden relative"
        >
          {/* Subtle animated background orb */}
          <motion.div
            className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          {/* Hero Text */}
          <div className="flex-1 min-w-[200px] max-w-full flex flex-col justify-center items-center md:items-start w-full">
            <h1 className="font-extrabold text-foreground text-3xl sm:text-4xl md:text-5xl text-center md:text-left mb-4 sm:mb-6 leading-tight drop-shadow-sm z-10 w-full break-words">
              Turn{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Trash
              </span>{" "}
              Into Treasure 🌍
            </h1>
            <p className="text-gray-600 text-center md:text-left mb-6 sm:mb-8 max-w-lg w-full text-base sm:text-lg leading-relaxed px-2 sm:px-0">
              Earn rewards for eco-friendly waste disposal. Upload proof, earn
              credits, and redeem them for cool prizes while saving the planet.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 w-full z-10">
              <Link href="/dashboard/scan" passHref className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gradient-eco text-white hover:opacity-90 font-semibold px-6 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-lg">
                  🚮 Upload Disposal
                </Button>
              </Link>
              <Link href="#" passHref className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary/50 text-primary font-semibold px-6 py-6 rounded-xl hover:bg-primary/5 transition-all text-lg bg-white/50 backdrop-blur-sm"
                >
                  📍 Find Bins
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center items-center z-10"
          >
            <motion.div
              className="relative group cursor-pointer"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src={binsImg}
                alt="Recycling bins illustration"
                width={280}
                height={260}
                className="rounded-2xl bg-white/40 backdrop-blur-md p-4 shadow-2xl border border-white/50 object-contain transition-transform duration-500"
                priority
              />
              <motion.div
                className="absolute -bottom-4 -right-4 bg-gradient-eco text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl border border-white/20"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ♻ Eco Mode ON
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* How It Works Section */}
        <div className="pt-12 sm:pt-16 pb-10">
          <div className="mx-auto max-w-5xl px-2 sm:px-6">
            {/* Section Heading */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                🌱 How It Works
              </h2>
              <p className="text-gray-500 text-base">
                3 easy steps to earn eco-rewards and make a real difference.
              </p>
              <div className="w-20 h-1 mx-auto bg-gradient-to-r from-green-500 to-blue-400 rounded-full mt-4"></div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-10">
              {[
                {
                  step: 1,
                  icon: <Camera size={32} className="text-primary" />,
                  title: "Collect & Scan",
                  desc: "Snap a pic of your waste item for quick recognition.",
                  color: "primary",
                },
                {
                  step: 2,
                  icon: <CheckCircle size={32} className="text-blue-500" />,
                  title: "Verify & Submit",
                  desc: "AI checks your waste type and rewards you instantly.",
                  color: "blue",
                },
                {
                  step: 3,
                  icon: <Coins size={32} className="text-amber-500" />,
                  title: "Earn Rewards",
                  desc: "Redeem points for cash, coupons, or eco-friendly gifts.",
                  color: "amber",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-8 rounded-3xl text-center bg-glass shadow-xl border border-white/40 hover:shadow-2xl transition-shadow relative overflow-hidden"
                >
                  <div className="text-primary font-bold text-lg mb-2">
                    Step {item.step}
                  </div>
                  <div className="inline-flex items-center justify-center mb-3 p-3 bg-primary/10 rounded-full">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground text-xl mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mt-14"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 bg-gradient-eco text-white px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/20"
              >
                <Leaf size={24} />
                <span className="text-lg">Start earning eco rewards today!</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </section >
    </>
  );
}
