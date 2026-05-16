"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout}
      className="bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
    >
      Sign Out
    </Button>
  );
}
