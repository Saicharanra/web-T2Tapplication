
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure system preferences and options</p>
      </div>

      <Card className="overflow-hidden border-gray-200 shadow-sm mt-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-300 to-gray-400"></div>
        <CardContent className="p-16">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <SettingsIcon className="h-20 w-20 text-gray-300 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Settings Panel Coming Soon</h2>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
              Advanced configuration options for system management, user roles, point values, and more will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
