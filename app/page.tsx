"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import {
  Leaf,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Recycle,
  Camera,
} from "lucide-react";
import heroImage from "@/assets/hero-recycling.jpg";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import Footer from "@/app/dashboard/footer/page";

export default function Home() {
  const { isSignedIn } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fix: define fetchUserRole with useCallback to prevent useEffect issues
  const fetchUserRole = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role ?? null);
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      setLoading(true);
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [isSignedIn, fetchUserRole]);

  // Ensure all stats have a visible box by checking their data is correct and providing a fallback
  const stats = [
    {
      title: "Active Users",
      value: "12,450",
      icon: Users,
      variant: "primary" as const,
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Total Points Awarded",
      value: "2.4M",
      icon: Award,
      variant: "warning" as const,
      trend: { value: 18, isPositive: true },
    },
    {
      title: "Waste Recycled",
      value: "45.2 Tons",
      icon: TrendingUp,
      variant: "success" as const,
      trend: { value: 32, isPositive: true },
    },
    // Ensure CO₂ Saved stat has its box rendered by keeping it in the array
    {
      title: "CO₂ Saved",
      value: "128 Tons",
      icon: Leaf,
      variant: "secondary" as const,
      trend: { value: 15, isPositive: true },
    },
  ];

  // Ensure the Upload Photo step is present in the correct position for "How It Works"
  const steps = [
    {
      step: "01",
      title: "Collect & Sort",
      desc:
        "Separate your recyclable waste - plastics, paper, metal, or electronics.",
      icon: Recycle,
      color: "primary",
    },
    {
      step: "02",
      title: "Upload Photo",
      desc:
        "Take a clear photo of your sorted waste and upload it through our app.",
      icon: Camera,
      color: "secondary",
    },
    {
      step: "03",
      title: "Earn Rewards",
      desc:
        "Get points verified by our team and redeem them for exciting rewards!",
      icon: Award,
      color: "warning",
    },
  ];

  // Helper for dynamic Tailwind classes (to avoid runtime errors)
  const getBgClass = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary/10";
      case "secondary":
        return "bg-secondary/10";
      case "warning":
        return "bg-warning/10";
      default:
        return "bg-gray-100";
    }
  };
  const getTextClass = (color: string) => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "secondary":
        return "text-secondary";
      case "warning":
        return "text-warning";
      default:
        return "text-gray-500";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-eco py-20 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Leaf className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Telangana&apos;s Green Revolution
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md">
              Turn Your Trash Into
              <span className="block text-accent"> Treasure</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow-sm">
              Earn rewards for responsible recycling. Join thousands of citizens
              making Telangana cleaner and greener, one upload at a time.
            </p>

            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 shadow-xl group transition-all hover:scale-105"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white hover:shadow-lg transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                {loading ? (
                  <div className="flex items-center gap-2 text-white">
                    <Recycle className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : userRole === "ADMIN" ? (
                  <Link href="/admin">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-xl"
                    >
                      ⚙️ Admin Panel
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/home">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-xl transition-transform hover:scale-105"
                    >
                      🌍 Go to Dashboard
                    </Button>
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </motion.div>

          {/* Right Side Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <Image
                src={
                  typeof heroImage === "string"
                    ? heroImage
                    : (heroImage as { src: string }).src || "/assets/hero-recycling.jpg"
                }
                alt="People recycling with smartphone app showing reward points"
                width={500}
                height={320}
                className="w-full h-auto object-cover"
                priority
              />
            </motion.div>
            <motion.div
              className="absolute -top-6 -right-6 bg-glass text-accent-foreground rounded-full p-6 shadow-xl"
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Recycle className="h-12 w-12 text-primary" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 -mt-12 relative z-10">
        <div className="container mx-auto">
          {/* 
            The CO₂ Saved box will always render since it is in stats array.
            If it is not appearing, check if StatCard itself has conditional logic hiding it (not in this component).
            Also ensure lg:grid-cols-4 for 4 stats.
          */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {stats.map((stat) => (
              <motion.div key={stat.title} variants={itemVariants} whileHover={{ y: -5 }}>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  variant={stat.variant}
                  trend={stat.trend}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start earning rewards for recycling
            </p>
          </motion.div>

          {/* "Upload Photo" should always appear as the second card */}
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {steps.map((step) => (
              <motion.div key={step.step} variants={itemVariants} whileHover={{ y: -10 }}>
                <Card className="relative p-8 rounded-2xl border border-white/40 bg-glass hover:shadow-2xl transition-all duration-300 h-full">
                  <CardHeader>
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${getBgClass(
                        step.color
                      )} mb-6 shadow-sm`}
                    >
                      {/* @ts-ignore */}
                      <step.icon className={`h-8 w-8 ${getTextClass(step.color)}`} />
                    </div>
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20 select-none">
                      {step.step}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-eco relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <motion.div
          className="container mx-auto text-center relative z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-glass border-white/30 shadow-2xl max-w-3xl mx-auto backdrop-blur-lg">
            <CardHeader className="pt-12">
              <CardTitle className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Ready to Make a Difference?
              </CardTitle>
              <CardDescription className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join the Trash2Treasure community today and start earning
                rewards while saving our planet.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-12">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-xl text-lg font-bold px-10 py-6 rounded-full transition-transform hover:scale-105"
                >
                  Sign Up Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
