"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Preferences {
  emailUploadStatus: boolean;
  emailRewards: boolean;
  emailAnnouncements: boolean;
  emailWeeklySummary: boolean;
  emailMarketing: boolean;
  emailPickups: boolean;
  emailCampaigns: boolean;
  pushUploadStatus: boolean;
  pushRewards: boolean;
  pushAnnouncements: boolean;
  pushPickups: boolean;
  pushCampaigns: boolean;
}

const defaultPreferences: Preferences = {
  emailUploadStatus: true,
  emailRewards: true,
  emailAnnouncements: true,
  emailWeeklySummary: true,
  emailMarketing: false,
  emailPickups: true,
  emailCampaigns: true,
  pushUploadStatus: true,
  pushRewards: true,
  pushAnnouncements: true,
  pushPickups: true,
  pushCampaigns: true,
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
        checked
          ? "bg-gradient-to-r from-teal-500 to-emerald-500 shadow-inner"
          : "bg-gray-200 dark:bg-gray-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  // Fetch preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok) {
          const data = await res.json();
          setPreferences({ ...defaultPreferences, ...data.preferences });
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast({
          title: "✅ Preferences Saved",
          description: "Your notification settings have been updated.",
        });
      } else {
        toast({
          title: "❌ Error",
          description: "Failed to save preferences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "❌ Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Preferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Notification Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Control how and when you receive notifications
            </p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Email Notifications
          </h2>
        </div>

        <SettingRow
          icon="📸"
          title="Upload Status"
          description="Get notified when your uploads are approved or rejected"
          checked={preferences.emailUploadStatus}
          onChange={(v) => update("emailUploadStatus", v)}
        />
        <SettingRow
          icon="🪙"
          title="Rewards & Points"
          description="Points earned, reward redemptions, and balance updates"
          checked={preferences.emailRewards}
          onChange={(v) => update("emailRewards", v)}
        />
        <SettingRow
          icon="📢"
          title="Announcements"
          description="Important platform announcements from the T2T team"
          checked={preferences.emailAnnouncements}
          onChange={(v) => update("emailAnnouncements", v)}
        />
        <SettingRow
          icon="📊"
          title="Weekly Summary"
          description="Your weekly recycling impact report with stats"
          checked={preferences.emailWeeklySummary}
          onChange={(v) => update("emailWeeklySummary", v)}
        />
        <SettingRow
          icon="🚛"
          title="Pickups"
          description="Pickup scheduling and completion updates"
          checked={preferences.emailPickups}
          onChange={(v) => update("emailPickups", v)}
        />
        <SettingRow
          icon="🏆"
          title="Campaigns"
          description="Special campaigns, challenges, and events"
          checked={preferences.emailCampaigns}
          onChange={(v) => update("emailCampaigns", v)}
        />
        <SettingRow
          icon="📧"
          title="Marketing"
          description="Promotional content, tips, and product updates"
          checked={preferences.emailMarketing}
          onChange={(v) => update("emailMarketing", v)}
        />
      </div>

      {/* In-App Notifications */}
      <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            In-App Notifications
          </h2>
        </div>

        <SettingRow
          icon="📸"
          title="Upload Status"
          description="In-app alerts for upload approvals and rejections"
          checked={preferences.pushUploadStatus}
          onChange={(v) => update("pushUploadStatus", v)}
        />
        <SettingRow
          icon="🪙"
          title="Rewards & Points"
          description="Live updates for point transactions and redemptions"
          checked={preferences.pushRewards}
          onChange={(v) => update("pushRewards", v)}
        />
        <SettingRow
          icon="📢"
          title="Announcements"
          description="Realtime platform announcements"
          checked={preferences.pushAnnouncements}
          onChange={(v) => update("pushAnnouncements", v)}
        />
        <SettingRow
          icon="🚛"
          title="Pickups"
          description="Live pickup status notifications"
          checked={preferences.pushPickups}
          onChange={(v) => update("pushPickups", v)}
        />
        <SettingRow
          icon="🏆"
          title="Campaigns"
          description="Campaign participation and progress updates"
          checked={preferences.pushCampaigns}
          onChange={(v) => update("pushCampaigns", v)}
        />
      </div>

      {/* Privacy */}
      <div className="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Privacy
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Your email address is only used for transactional notifications you
          opt into. We never share your data with third parties. You can
          unsubscribe from any notification type at any time.
        </p>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "rounded-xl px-8 py-3 font-semibold shadow-lg transition-all duration-300",
            saved
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
              : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-200/50"
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
