"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
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
