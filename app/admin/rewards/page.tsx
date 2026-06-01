"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Gift, Package, ShoppingBag, Star,
  Plus, Search, Edit2, Trash2, Eye, Tag, ArrowUpRight,
  X, Loader2, AlertCircle, CheckCircle
} from "lucide-react";

/* ──────────────────── Types ──────────────────── */

interface Reward {
  reward_id: string;
  title: string;
  description: string;
  points_required: number;
  image_url: string;
  status: "Active" | "Inactive";
  category: string;
  stock: number;
  created_at: string;
  updated_at: string;
  redemptions: number;
}

interface Redemption {
  redemption_id: string;
  reward_id: string;
  user_id: string;
  status?: string;
  redeemed_at: string;
  reward?: { title: string; points_required: number; image_url: string } | null;
  user?: { name: string; email: string; imageUrl?: string } | null;
}

interface RewardForm {
  title: string;
  description: string;
  points_required: string;
  image_url: string;
  status: "Active" | "Inactive";
  category: string;
  stock: string;
}

const emptyForm: RewardForm = {
  title: "",
  description: "",
  points_required: "",
  image_url: "🎁",
  status: "Active",
  category: "General",
  stock: "0",
};

const categories = ["All", "Merchandise", "Environment", "Gift Cards", "Experiences", "Digital", "General"];

/* ──────────────────── Component ──────────────────── */

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ totalRewards: 0, activeRewards: 0, totalRedemptions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<RewardForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ──────────────── Fetch Data ──────────────── */

  const fetchRewards = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/admin/rewards");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch rewards");
      }
      const data = await res.json();
      setRewards(data.rewards || []);
      setStats(data.stats || { totalRewards: 0, activeRewards: 0, totalRedemptions: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rewards");
    }
  }, []);

  const fetchRedemptions = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/admin/rewards/redemptions?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setRedemptions(data.redemptions || []);
    } catch {
      // Silently fail for redemptions
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchRewards(), fetchRedemptions()]);
      setLoading(false);
    };
    load();
  }, [fetchRewards, fetchRedemptions]);

  /* ──────────────── Toast ──────────────── */

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeliverRedemption = async (redemptionId: string) => {
    try {
      const res = await fetchWithAuth("/api/admin/rewards/redemptions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redemption_id: redemptionId,
          status: "DELIVERED",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as delivered");
      }

      showToast("🎁 Reward marked as delivered and user notified!", "success");
      // Refresh list
      fetchRedemptions();
    } catch (err: any) {
      showToast(err.message || "Failed to mark as delivered", "error");
    }
  };

  /* ──────────────── Validation ──────────────── */

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.points_required || isNaN(Number(form.points_required)) || Number(form.points_required) <= 0)
      errors.points_required = "Points must be a positive number";
    if (form.stock !== "" && (isNaN(Number(form.stock)) || Number(form.stock) < 0))
      errors.stock = "Stock must be a non-negative number";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ──────────────── CRUD Handlers ──────────────── */

  const handleAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleEdit = (reward: Reward) => {
    setForm({
      title: reward.title,
      description: reward.description,
      points_required: String(reward.points_required),
      image_url: reward.image_url,
      status: reward.status,
      category: reward.category,
      stock: String(reward.stock),
    });
    setFormErrors({});
    setEditingId(reward.reward_id);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        points_required: Number(form.points_required),
        image_url: form.image_url.trim() || "🎁",
        status: form.status,
        category: form.category.trim() || "General",
        stock: Number(form.stock) || 0,
      };

      const url = modalMode === "add" ? "/api/admin/rewards" : `/api/admin/rewards/${editingId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${modalMode} reward`);
      }

      showToast(
        modalMode === "add" ? "Reward created successfully!" : "Reward updated successfully!",
        "success"
      );
      setShowModal(false);
      await fetchRewards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Operation failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/admin/rewards/${rewardId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete reward");
      }
      showToast("Reward deleted successfully!", "success");
      setDeleteConfirm(null);
      await fetchRewards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ──────────────── Client-side Filter ──────────────── */

  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch = searchTerm === "" ||
      reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /* ──────────────── Stats Data ──────────────── */

  const pendingRedemptions = redemptions.length;

  const statCards = [
    { title: "Total Rewards", value: stats.totalRewards, icon: Gift, gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-200/50" },
    { title: "Active Rewards", value: stats.activeRewards, icon: Star, gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-200/50" },
    { title: "Total Redemptions", value: stats.totalRedemptions, icon: ShoppingBag, gradient: "from-blue-500 to-indigo-600", glow: "shadow-blue-200/50" },
    { title: "Recent Claims", value: pendingRedemptions, icon: Package, gradient: "from-amber-500 to-orange-600", glow: "shadow-amber-200/50" },
  ];

  /* ──────────────── Loading State ──────────────── */

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
            <p className="text-gray-500 mt-1">Loading rewards data...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  /* ──────────────── Error State ──────────────── */

  if (error) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-rose-700 mb-2">Failed to load rewards</h3>
          <p className="text-rose-600 mb-4">{error}</p>
          <Button onClick={() => { setLoading(true); fetchRewards().then(() => setLoading(false)); }}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  /* ──────────────── Render ──────────────── */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300
          ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
          <p className="text-gray-500 mt-1">Manage reward catalog, track redemptions, and analyze performance</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 px-5 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Reward
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100/80 relative overflow-hidden hover:-translate-y-1.5 transition-all duration-400 hover:shadow-xl cursor-default">
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.gradient}`}></div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</h3>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rewards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-200/80 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                  ${selectedCategory === cat
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/80'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-16 text-center">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No rewards found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || selectedCategory !== "All" ? "Try adjusting your search or filters" : "Get started by adding your first reward"}
          </p>
          {!searchTerm && selectedCategory === "All" && (
            <Button onClick={handleAdd} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Add First Reward
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRewards.map((reward) => (
            <div key={reward.reward_id} className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 overflow-hidden hover:-translate-y-1.5 transition-all duration-400 hover:shadow-xl">
              {/* Card Header with Emoji + Status */}
              <div className="relative p-5 pb-3">
                <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                  ${reward.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                    'bg-gray-50 text-gray-500 border border-gray-200/50'}`}>
                  {reward.status}
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 flex items-center justify-center text-3xl shadow-sm">
                    {reward.image_url}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-gray-900 text-base truncate">{reward.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{reward.description}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-5 pb-3 space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Category
                  </span>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">{reward.category}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Points Cost</span>
                  <span className="text-sm font-bold text-emerald-600">{reward.points_required.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Stock</span>
                  <span className={`text-xs font-bold ${reward.stock === 0 ? 'text-rose-500' : reward.stock < 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                    {reward.stock >= 999 ? '∞ Unlimited' : reward.stock}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-gray-400 font-medium">Redemptions</span>
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" /> {reward.redemptions}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-2 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(reward)}
                  className="flex-1 rounded-xl text-xs h-9 border-gray-200/80 hover:bg-gray-50">
                  <Edit2 className="h-3 w-3 mr-1.5" /> Edit
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => setDeleteConfirm(reward.reward_id)}
                  className="rounded-xl text-xs h-9 border-gray-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-2.5">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Redemptions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 overflow-hidden">
        <div className="p-5 border-b border-gray-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Redemptions</h2>
              <p className="text-[11px] text-gray-400">Latest reward claims</p>
            </div>
          </div>
        </div>

        {redemptions.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No redemptions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100/80 bg-gray-50/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reward</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Points Used</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.redemption_id} className="border-b border-gray-50/80 hover:bg-gray-50/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {r.user?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <span className="font-medium text-sm text-gray-900 block">{r.user?.name || "Unknown User"}</span>
                          <span className="text-[11px] text-gray-400">{r.user?.email || r.user_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm font-medium text-gray-700">{r.reward?.title || `Reward #${r.reward_id}`}</td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-bold text-rose-500">-{(r.reward?.points_required || 0).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-500" suppressHydrationWarning={true}>
                      {new Date(r.redeemed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        r.status === 'DELIVERED' ? 'bg-green-100/80 text-green-700' : 'bg-amber-100/80 text-amber-700'
                      }`}>
                        {r.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {(!r.status || r.status === 'PENDING') ? (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-semibold px-3 py-1.5 shadow-md shadow-emerald-100/50"
                          onClick={() => handleDeliverRedemption(r.redemption_id)}
                        >
                          🎁 Deliver
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium mr-2">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──── Add / Edit Modal ──── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-5 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                  {modalMode === "add" ? <Plus className="h-5 w-5 text-white" /> : <Edit2 className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{modalMode === "add" ? "Add New Reward" : "Edit Reward"}</h3>
                  <p className="text-xs text-gray-400">{modalMode === "add" ? "Create a new reward for users" : "Update reward details"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Eco Tote Bag"
                  className={`rounded-xl ${formErrors.title ? "border-rose-300 focus:ring-rose-500" : "border-gray-200"}`}
                />
                {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the reward..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none bg-white"
                />
              </div>

              {/* Points + Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Points Required *</label>
                  <Input
                    type="number"
                    value={form.points_required}
                    onChange={(e) => setForm({ ...form, points_required: e.target.value })}
                    placeholder="e.g. 200"
                    min="1"
                    className={`rounded-xl ${formErrors.points_required ? "border-rose-300 focus:ring-rose-500" : "border-gray-200"}`}
                  />
                  {formErrors.points_required && <p className="text-xs text-rose-500 mt-1">{formErrors.points_required}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Stock</label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 50"
                    min="0"
                    className={`rounded-xl ${formErrors.stock ? "border-rose-300 focus:ring-rose-500" : "border-gray-200"}`}
                  />
                  {formErrors.stock && <p className="text-xs text-rose-500 mt-1">{formErrors.stock}</p>}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Image / Emoji</label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="🎁 or https://..."
                  className="rounded-xl border-gray-200"
                />
              </div>

              {/* Category + Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white h-10"
                  >
                    {categories.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white h-10"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-5 flex gap-3 rounded-b-2xl">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl" disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-200/50 font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  modalMode === "add" ? "Create Reward" : "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Delete Confirmation Modal ──── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Reward?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The reward and all its redemption history will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl" disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
              >
                {deleting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
