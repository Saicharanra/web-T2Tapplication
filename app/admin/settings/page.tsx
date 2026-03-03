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

      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <SettingsIcon className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Settings Panel Coming Soon</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Advanced configuration options for system management, user roles, point values, and more will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
