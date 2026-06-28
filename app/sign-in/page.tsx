import type { Metadata } from "next";
import SignInClient from "./SignInClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your Trash2Treasure account to manage your recycling points and rewards.",
  alternates: {
    canonical: "https://trash2treasure.co.in/sign-in",
  },
};

export default function SignInPage() {
  return <SignInClient />;
}
