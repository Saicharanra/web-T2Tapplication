"use client";

import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, CheckCircle2, AlertCircle, RefreshCw, X, Loader2, Ban, ShieldAlert,
  ThumbsUp, Calendar, Mail, Search
} from "lucide-react";

interface BusinessOwner {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  joinedAt: string;
  imageUrl?: string;
}

export default function ManageBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchBusinesses = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchWithAuth("/api/admin/businesses");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch businesses");
      }
      const data = await res.json();
      setBusinesses(data.businesses || []);
    } catch (err: any) {
      setError(err.message || "Failed to load businesses list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateStatus = async (businessId: string, status: string) => {
    setProcessingId(businessId);
    try {
      const res = await fetchWithAuth("/api/admin/businesses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, status })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update business status");
      }

      showToast(`Business owner successfully ${status === 'ACTIVE' ? 'approved' : 'suspended'}!`, "success");
      await fetchBusinesses();
    } catch (err: any) {
      showToast(err.message || "Failed to update business", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBusinesses = businesses.filter((biz) => {
    const matchesSearch = searchTerm === "" ||
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || biz.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <title>Manage Businesses | Admin Panel</title>

      {/* Toast */}
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-emerald-600 animate-pulse" />
            Manage Businesses
          </h1>
          <p className="text-gray-500 mt-1">Approve new business registrations and manage existing active partner companies.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => { setLoading(true); fetchBusinesses(); }}
          className="border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl bg-white shadow-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by company owner name or email..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-gray-200/80 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-200 p-2.5 text-sm bg-white focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ACTIVE">Active / Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid of Business Owners */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/80 p-16 text-center">
          <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No businesses found</h3>
          <p className="text-gray-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBusinesses.map((biz) => {
            return (
              <Card key={biz.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl border-gray-100/80 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm uppercase">
                      {biz.name.slice(0, 2)}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm border
                      ${biz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                        biz.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200/50 animate-pulse' :
                        'bg-rose-50 text-rose-700 border-rose-200/50'}`}>
                      {biz.status === 'PENDING_APPROVAL' ? 'Pending Approval' : biz.status === 'ACTIVE' ? 'Approved' : biz.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-base">{biz.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{biz.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Joined {new Date(biz.joinedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </CardContent>

                <div className="px-5 pb-5 pt-3 border-t border-gray-100/50 flex gap-2">
                  {biz.status === "PENDING_APPROVAL" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={processingId === biz.id}
                        onClick={() => handleUpdateStatus(biz.id, "ACTIVE")}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold h-9 shadow-sm"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === biz.id}
                        onClick={() => handleUpdateStatus(biz.id, "SUSPENDED")}
                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold h-9"
                      >
                        Reject
                      </Button>
                    </>
                  ) : biz.status === "ACTIVE" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingId === biz.id}
                      onClick={() => handleUpdateStatus(biz.id, "SUSPENDED")}
                      className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold h-9 flex items-center justify-center gap-1.5"
                    >
                      <Ban className="h-3.5 w-3.5" /> Suspend Partner
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingId === biz.id}
                      onClick={() => handleUpdateStatus(biz.id, "ACTIVE")}
                      className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-bold h-9 flex items-center justify-center gap-1.5"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> Approve Account
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
