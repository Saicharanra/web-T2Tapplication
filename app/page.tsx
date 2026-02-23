"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import {
  Leaf,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Recycle,
  Loader2,
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-eco py-20 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Leaf className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Telangana&apos;s Green Revolution
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Turn Your Trash Into
              <span className="block text-accent"> Treasure</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Earn rewards for responsible recycling. Join thousands of citizens
              making Telangana cleaner and greener, one upload at a time.
            </p>

            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 shadow-strong group"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                {loading ? (
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : userRole === "ADMIN" ? (
                  <Link href="/admin">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-strong"
                    >
                      ⚙️ Admin Panel
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/home">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-strong"
                    >
                      🌍 Go to Dashboard
                    </Button>
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>

          {/* Right Side Image */}
          <div className="relative animate-slide-up">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
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
            </div>
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground rounded-full p-6 shadow-strong animate-pulse-soft">
              <Recycle className="h-12 w-12" />
            </div>
          </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
                trend={stat.trend}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start earning rewards for recycling
            </p>
          </div>

          {/* "Upload Photo" should always appear as the second card */}
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card
                key={step.step}
                className="relative p-8 rounded-2xl border-2 border-border bg-gradient-subtle hover:shadow-medium transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${getBgClass(
                      step.color
                    )} mb-6`}
                  >
                    {/* The icon for "Upload Photo" will be Camera, see steps array above */}
                    {/* @ts-ignore */}
                    <step.icon className={`h-8 w-8 ${getTextClass(step.color)}`} />
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/10">
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
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-eco">
        <div className="container mx-auto text-center">
          <Card className="bg-transparent border-none shadow-none max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Make a Difference?
              </CardTitle>
              <CardDescription className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join the Trash2Treasure community today and start earning
                rewards while saving our planet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-strong text-lg font-bold px-10 py-6 rounded-full"
                >
                  Sign Up Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
