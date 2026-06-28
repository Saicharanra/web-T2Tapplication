"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings as SettingsIcon, Shield, Bell, Palette, Database,
  Globe, Mail, Lock, Save, RefreshCw, ChevronRight, Zap
} from "lucide-react";

interface PointsConfig {
  plasticBottles: number;
  aluminumCans: number;
  paperWaste: number;
  electronicWaste: number;
  glassItems: number;
  textileWaste: number;
}

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Trash2Treasure Telangana");
  const [siteDescription, setSiteDescription] = useState("Incentivizing waste recycling across Telangana through points and rewards");
  const [adminEmail, setAdminEmail] = useState("admin@t2t-telangana.org");
  const [saving, setSaving] = useState(false);

  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({
    "Plastic Bottles": 15,
    "Paper Waste": 10,
    "Metal Cans": 25,
    "Glass Bottles": 20,
    "Cardboard": 12,
    "E-Waste": 50,
    "Organic Waste": 18,
    "Mixed Recyclables": 8
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetchWithAuth('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.pointsConfig) {
            setPointsConfig(data.pointsConfig);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const [notifications, setNotifications] = useState({
    newSubmission: true,
    submissionVerified: true,
    newUser: false,
    weeklyReport: true,
    systemAlerts: true,
    emailDigest: false,
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsConfig }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSaving(false);
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  const Toggle = ({ enabled, onChange, label, description }: { enabled: boolean; onChange: () => void; label: string; description: string }) => (
    <div className="flex items-center justify-between py-3.5 group">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 flex-shrink-0 ${enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-200/50' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? 'translate-x-5.5' : 'translate-x-1'}`}
          style={{ width: '18px', height: '18px', transform: enabled ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, description, gradient }: { icon: any; title: string; description: string; gradient: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );

  const wasteTypes: { key: string; label: string; emoji: string }[] = [
    { key: 'Plastic Bottles', label: 'Plastic Bottles', emoji: '🧴' },
    { key: 'Metal Cans', label: 'Metal Cans', emoji: '🥫' },
    { key: 'Paper Waste', label: 'Paper Waste', emoji: '📄' },
    { key: 'E-Waste', label: 'E-Waste', emoji: '💻' },
    { key: 'Glass Bottles', label: 'Glass Bottles', emoji: '🫙' },
    { key: 'Cardboard', label: 'Cardboard', emoji: '📦' },
    { key: 'Organic Waste', label: 'Organic Waste', emoji: '🥬' },
    { key: 'Mixed Recyclables', label: 'Mixed', emoji: '♻️' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <title>System Settings | Admin Panel</title>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure system preferences and platform options</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 px-6 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
        >
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-6">
        <SectionHeader icon={Globe} title="General Settings" description="Basic platform configuration" gradient="from-blue-500 to-indigo-600" />

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="rounded-xl border-gray-200/80 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 h-11"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200/80 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 p-3 text-sm resize-none h-20 outline-none focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Contact Email</label>
            <Input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="rounded-xl border-gray-200/80 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50 h-11"
            />
          </div>
        </div>
      </div>

      {/* Points Configuration */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-6">
        <SectionHeader icon={Zap} title="Points Configuration" description="Set base points per waste type" gradient="from-amber-500 to-orange-600" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wasteTypes.map(({ key, label, emoji }) => (
            <div key={key} className="bg-gray-50/50 rounded-xl border border-gray-100/80 p-4 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={pointsConfig[key]}
                  onChange={(e) => setPointsConfig({ ...pointsConfig, [key]: parseInt(e.target.value) || 0 })}
                  className="rounded-lg border-gray-200/80 h-10 text-center font-bold text-emerald-700 bg-white"
                  min={0}
                  max={500}
                />
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-6">
        <SectionHeader icon={Bell} title="Notification Settings" description="Control email and push notifications" gradient="from-violet-500 to-purple-600" />

        <div className="divide-y divide-gray-100/80">
          <Toggle
            label="New Submission Alerts"
            description="Get notified when users submit new waste reports"
            enabled={notifications.newSubmission}
            onChange={() => setNotifications({ ...notifications, newSubmission: !notifications.newSubmission })}
          />
          <Toggle
            label="Verification Updates"
            description="Notifications when submissions are verified or rejected"
            enabled={notifications.submissionVerified}
            onChange={() => setNotifications({ ...notifications, submissionVerified: !notifications.submissionVerified })}
          />
          <Toggle
            label="New User Registration"
            description="Alert when new users sign up on the platform"
            enabled={notifications.newUser}
            onChange={() => setNotifications({ ...notifications, newUser: !notifications.newUser })}
          />
          <Toggle
            label="Weekly Report"
            description="Receive a weekly analytics summary via email"
            enabled={notifications.weeklyReport}
            onChange={() => setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })}
          />
          <Toggle
            label="System Alerts"
            description="Critical system notifications and error alerts"
            enabled={notifications.systemAlerts}
            onChange={() => setNotifications({ ...notifications, systemAlerts: !notifications.systemAlerts })}
          />
          <Toggle
            label="Daily Email Digest"
            description="Consolidated daily summary of all platform activity"
            enabled={notifications.emailDigest}
            onChange={() => setNotifications({ ...notifications, emailDigest: !notifications.emailDigest })}
          />
        </div>
      </div>

      {/* Security */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-6">
        <SectionHeader icon={Shield} title="Security & Access" description="Manage security settings and roles" gradient="from-rose-500 to-red-600" />

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-xl border border-gray-100/80 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Two-Factor Authentication</p>
                <p className="text-xs text-gray-400">Add extra security to admin accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Recommended</span>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-xl border border-gray-100/80 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Admin Role Management</p>
                <p className="text-xs text-gray-400">Manage admin privileges and permissions</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-xl border border-gray-100/80 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Data Export</p>
                <p className="text-xs text-gray-400">Export all platform data in CSV or JSON</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-200/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200/50">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-700">Danger Zone</h2>
            <p className="text-xs text-gray-400">Irreversible and destructive actions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-xl border border-rose-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">Reset All Points</p>
            <p className="text-xs text-gray-400">This will reset all user points to zero. This cannot be undone.</p>
          </div>
          <Button variant="destructive" size="sm" className="rounded-xl px-5 shadow-sm whitespace-nowrap">
            Reset Points
          </Button>
        </div>
      </div>
    </div>
  );
}
