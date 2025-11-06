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
      <section className="w-full px-0 md:px-4 bg-gradient-to-br from-green-50 via-white to-blue-50 min-h-screen flex flex-col">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col-reverse md:flex-row items-center justify-between rounded-3xl bg-gradient-to-br from-[#e6f9ee] to-[#e3f0ff] p-6 md:p-14 gap-10 shadow-lg border border-gray-100 mt-8 md:mt-12"
        >
          {/* Hero Text */}
          <div className="flex-1 min-w-[250px] flex flex-col justify-center items-center md:items-start">
            <h1 className="font-extrabold text-[#184A26] text-3xl md:text-5xl text-center md:text-left mb-4 leading-tight">
              Turn{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
                Trash
              </span>{" "}
              Into Treasure 🌍
            </h1>
            <p className="text-gray-600 text-center md:text-left mb-8 max-w-lg text-lg leading-relaxed">
              Earn rewards for eco-friendly waste disposal. Upload proof, earn
              credits, and redeem them for cool prizes while saving the planet.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Link href="/dashboard" passHref>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all">
                  🚮 Upload Disposal
                </Button>
              </Link>
              <Link href="#" passHref>
                <Button
                  variant="outline"
                  className="border-2 border-green-600 text-green-700 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 hover:border-green-700 transition-all"
                >
                  📍 Find Bins
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center items-center"
          >
            <div className="relative group">
              <Image
                src={binsImg}
                alt="Recycling bins illustration"
                width={280}
                height={260}
                className="rounded-2xl bg-white/70 p-3 shadow-xl object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
              <div className="absolute -bottom-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md animate-pulse">
                ♻ Eco Mode ON
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* How It Works Section */}
        <div className="pt-16 pb-10">
          <div className="mx-auto max-w-5xl">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
              {[
                {
                  step: 1,
                  icon: <Camera size={32} className="text-green-600" />,
                  title: "Collect & Scan",
                  desc: "Snap a pic of your waste item for quick recognition.",
                  color: "green",
                },
                {
                  step: 2,
                  icon: <CheckCircle size={32} className="text-blue-600" />,
                  title: "Verify & Submit",
                  desc: "AI checks your waste type and rewards you instantly.",
                  color: "blue",
                },
                {
                  step: 3,
                  icon: <Coins size={32} className="text-yellow-600" />,
                  title: "Earn Rewards",
                  desc: "Redeem points for cash, coupons, or eco-friendly gifts.",
                  color: "yellow",
                },
              ].map(({ step, icon, title, desc, color }) => (
                <motion.div
                  key={step}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-2xl text-center bg-white shadow-md border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className={`text-${color}-500 font-bold text-lg mb-2`}>
                    Step {step}
                  </div>
                  <div
                    className={`inline-flex items-center justify-center mb-3 p-3 bg-${color}-50 rounded-full`}
                  >
                    {icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mt-14"
            >
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all">
                <Leaf size={20} />
                <span>Start earning eco rewards today!</span>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer/>
      </section>
    </>
  );
}
