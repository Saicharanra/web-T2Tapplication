import type { Metadata } from "next";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Trash2Treasure account and start recycling to earn rewards today.",
  alternates: {
    canonical: "https://trash2treasure.co.in/sign-up",
  },
};

export default function SignUpPage() {
  return <SignUpClient />;
}
