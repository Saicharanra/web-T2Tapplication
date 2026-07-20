"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Gift, Edit2, Trash2, Eye, Tag, Plus, X, Loader2, AlertCircle,
  CheckCircle2, RefreshCw, Upload, Sparkles, MapPin, Globe, Phone, FileText
} from "lucide-react";

interface Reward {
  reward_id: number;
  title: string;
  description: string;
  points_required: number;
  status: "Active" | "Inactive" | "PENDING_APPROVAL" | "Suspended";
  category: string;
  stock: number;
  max_redemptions: number;
  remaining_redemptions: number;
  company_name: string;
  logo_url: string;
  banner_url: string;
  discount_type: string;
  discount_value: number;
  original_price: number | null;
  expiry_date: string | null;
  min_purchase: number;
  terms: string;
  store_location: string;
  website: string;
  contact_number: string;
  allow_multiple: boolean;
  codesCount: number;
  unusedCodesCount: number;
  redemptionsCount?: number;
  codes?: string[];
}

interface CouponForm {
  company_name: string;
  title: string;
  description: string;
  category: string;
  discount_type: string;
  discount_value: string;
  original_price: string;
  codes: string;
  expiry_date: string;
  min_purchase: string;
  points_required: string;
  terms: string;
  store_location: string;
  website: string;
  contact_number: string;
  logo_url: string;
  banner_url: string;
  allow_multiple: boolean;
}

const emptyForm: CouponForm = {
  company_name: "",
  title: "",
  description: "",
  category: "General",
  discount_type: "Percentage",
  discount_value: "",
  original_price: "",
  codes: "",
  expiry_date: "",
  min_purchase: "0",
  points_required: "",
  terms: "",
  store_location: "",
  website: "",
  contact_number: "",
  logo_url: "",
  banner_url: "",
  allow_multiple: false,
};

const categories = ["Food", "Merchandise", "Environment", "Gift Cards", "Experiences", "Digital", "General"];

export default function BusinessCoupons() {
  const [coupons, setCoupons] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // File Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/business/rewards");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch coupons");
      }
      const data = await res.json();
      setCoupons(data.rewards || []);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "banner_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "logo_url") setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithAuth("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setForm(prev => ({ ...prev, [field]: data.imageUrl }));
      showToast(`${field === "logo_url" ? "Logo" : "Banner"} uploaded successfully!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploadingLogo(false);
      setUploadingBanner(false);
    }
  };

  const handleAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleEdit = (coupon: Reward) => {
    setForm({
      company_name: coupon.company_name,
      title: coupon.title,
      description: coupon.description,
      category: coupon.category,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      original_price: coupon.original_price ? String(coupon.original_price) : "",
      codes: coupon.codes ? coupon.codes.join("\n") : "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split("T")[0] : "",
      min_purchase: String(coupon.min_purchase),
      points_required: String(coupon.points_required),
      terms: coupon.terms,
      store_location: coupon.store_location,
      website: coupon.website,
      contact_number: coupon.contact_number,
      logo_url: coupon.logo_url,
      banner_url: coupon.banner_url,
      allow_multiple: coupon.allow_multiple,
    });
    setFormErrors({});
    setEditingId(coupon.reward_id);
    setModalMode("edit");
    setShowModal(true);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.company_name.trim()) errors.company_name = "Company name is required";
    if (!form.title.trim()) errors.title = "Coupon title is required";
    if (!form.points_required || isNaN(Number(form.points_required)) || Number(form.points_required) <= 0) {
      errors.points_required = "Points must be a positive number";
    }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
      errors.discount_value = "Discount value must be a positive number";
    }
    if (modalMode === "add" && !form.codes.trim()) {
      errors.codes = "At least one coupon code is required";
    }
    if (!form.logo_url) errors.logo_url = "Logo image is required";
    if (!form.banner_url) errors.banner_url = "Coupon banner image is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = {
        ...form,
        points_required: Number(form.points_required),
        discount_value: Number(form.discount_value),
        original_price: form.original_price ? Number(form.original_price) : null,
        min_purchase: Number(form.min_purchase),
        expiry_date: form.expiry_date || null,
        codes: form.codes.split(/[\n,]+/).map(c => c.trim()).filter(Boolean)
      };

      const url = modalMode === "add" ? "/api/business/rewards" : `/api/business/rewards/${editingId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Operation failed");
      }

      showToast(
        modalMode === "add" ? "Coupon submitted for approval!" : "Coupon updated successfully!",
        "success"
      );
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to save coupon", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (coupon: Reward) => {
    try {
      const nextStatus = coupon.status === "Active" ? "Inactive" : "Active";
      const res = await fetchWithAuth(`/api/business/rewards/${coupon.reward_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }

      showToast(
        nextStatus === "Active" ? "Coupon activated!" : "Coupon paused!",
        "success"
      );
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const handleDelete = async (rewardId: number) => {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/business/rewards/${rewardId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      showToast("Coupon deleted successfully!", "success");
      setDeleteConfirm(null);
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to delete coupon", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <title>Manage Coupons | Business Portal</title>
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300
          ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-semibold text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Coupons</h1>
          <p className="text-gray-500 mt-1">Create new coupon campaigns, update stock, and upload logo/banner details.</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 rounded-xl font-bold transition-all shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Gift className="h-16 w-16 mx-auto text-gray-200 mb-3" />
              <p className="font-semibold text-lg">No Coupons Created</p>
              <p className="text-sm mt-1">Click &quot;Add Coupon&quot; to submit your first eco reward!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Company</th>
                    <th className="py-4 px-6">Title</th>
                    <th className="py-4 px-6">Credits</th>
                    <th className="py-4 px-6">Redemptions</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => (
                    <tr key={coupon.reward_id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-800">{coupon.company_name}</td>
                      <td className="py-4 px-6 text-gray-600">{coupon.title}</td>
                      <td className="py-4 px-6 text-emerald-700 font-extrabold">{coupon.points_required} pts</td>
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {coupon.redemptionsCount} / {coupon.max_redemptions}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-block
                          ${coupon.status === "Active" ? "bg-emerald-100 text-emerald-800" :
                            coupon.status === "PENDING_APPROVAL" ? "bg-amber-100 text-amber-800 animate-pulse" :
                            coupon.status === "Suspended" ? "bg-rose-100 text-rose-800" :
                            "bg-gray-100 text-gray-800"}`}>
                          {coupon.status === "PENDING_APPROVAL" ? "Pending Approval" : coupon.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {coupon.status !== "PENDING_APPROVAL" && coupon.status !== "Suspended" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusToggle(coupon)}
                            className="text-gray-500 hover:bg-gray-100 rounded-xl"
                          >
                            {coupon.status === "Active" ? "Pause" : "Resume"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(coupon)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {deleteConfirm === coupon.reward_id ? (
                          <span className="inline-flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                            <Button
                              size="sm"
                              disabled={deleting}
                              onClick={() => handleDelete(coupon.reward_id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-500 hover:bg-gray-100 rounded-xl"
                            >
                              Cancel
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(coupon.reward_id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200/50 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                {modalMode === "add" ? "Create New Campaign" : "Edit Coupon Campaign"}
              </CardTitle>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {/* Primary Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="e.g. Starbucks"
                  />
                  {formErrors.company_name && <p className="text-xs text-rose-500">{formErrors.company_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Coupon Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Free Brewed Coffee"
                  />
                  {formErrors.title && <p className="text-xs text-rose-500">{formErrors.title}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain what the coupon gives and how to redeem it..."
                  className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category, Points, Discount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points_required">Green Points Required</Label>
                  <Input
                    id="points_required"
                    type="number"
                    value={form.points_required}
                    onChange={(e) => setForm({ ...form, points_required: e.target.value })}
                    placeholder="e.g. 150"
                  />
                  {formErrors.points_required && <p className="text-xs text-rose-500">{formErrors.points_required}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <select
                    id="discount_type"
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                    <option value="Freebie">Freebie</option>
                  </select>
                </div>
              </div>

              {/* Discount value, original price, min purchase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Value</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder="e.g. 15"
                  />
                  {formErrors.discount_value && <p className="text-xs text-rose-500">{formErrors.discount_value}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (Optional)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    placeholder="e.g. 120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Min Purchase Amount (₹)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    value={form.min_purchase}
                    onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                    placeholder="e.g. 299"
                  />
                </div>
              </div>

              {/* Expiry Date, Multiple claims */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="allow_multiple"
                    type="checkbox"
                    checked={form.allow_multiple}
                    onChange={(e) => setForm({ ...form, allow_multiple: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <Label htmlFor="allow_multiple">Allow Multiple Redemptions per User</Label>
                </div>
              </div>

              {/* Company Logo and Banner Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Logo Image</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-emerald-50/10 transition-all overflow-hidden shrink-0">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : uploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      ) : (
                        <Upload className="h-5 w-5 text-gray-400" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "logo_url")}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Logo Thumbnail</p>
                      <p className="mt-0.5">JPEG, PNG or WebP. Recommend square size (200x200px).</p>
                    </div>
                  </div>
                  {formErrors.logo_url && <p className="text-xs text-rose-500">{formErrors.logo_url}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Coupon Banner Image</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex flex-col items-center justify-center w-36 h-24 border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-emerald-50/10 transition-all overflow-hidden shrink-0">
                      {form.banner_url ? (
                        <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
                      ) : uploadingBanner ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      ) : (
                        <Upload className="h-5 w-5 text-gray-400" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "banner_url")}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">Offer Banner</p>
                      <p className="mt-0.5">Display cover for user rewards store. Recommended size (600x400px).</p>
                    </div>
                  </div>
                  {formErrors.banner_url && <p className="text-xs text-rose-500">{formErrors.banner_url}</p>}
                </div>
              </div>

              {/* Coupon Code Input */}
              {modalMode === "add" && (
                <div className="space-y-2 border-t pt-4 border-gray-200">
                  <Label htmlFor="codes" className="text-gray-900 font-bold flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Enter Coupon Codes
                  </Label>
                  <p className="text-[11px] text-gray-400 leading-normal mb-2">
                    Enter one or more coupon codes. If entering multiple, write each code on a separate line. The system will award these to users sequentially.
                  </p>
                  <textarea
                    id="codes"
                    value={form.codes}
                    onChange={(e) => setForm({ ...form, codes: e.target.value })}
                    placeholder="MCD-BREW-99X&#10;MCD-BREW-88Y&#10;MCD-BREW-77Z"
                    className="w-full min-h-[100px] rounded-xl border border-gray-200 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {formErrors.codes && <p className="text-xs text-rose-500">{formErrors.codes}</p>}
                </div>
              )}

              {/* Store Location, Web, Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="store_location" className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-600" />Store Location</Label>
                  <Input
                    id="store_location"
                    value={form.store_location}
                    onChange={(e) => setForm({ ...form, store_location: e.target.value })}
                    placeholder="e.g. Hyderabad, Telangana"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-600" />Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="e.g. https://starbucks.in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_number" className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-emerald-600" />Contact Number</Label>
                  <Input
                    id="contact_number"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    placeholder="e.g. +91 9999999999"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <textarea
                  id="terms"
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  placeholder="Add specific terms like: 'Valid only on dine-in', 'Cannot combine with other offers'..."
                  className="w-full min-h-[80px] rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </CardContent>

            <CardContent className="bg-gray-50 border-t border-gray-200/50 p-6 flex justify-end gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-gray-200 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploadingLogo || uploadingBanner}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold px-6 shadow-md"
              >
                {submitting ? "Saving..." : "Submit Coupon"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
