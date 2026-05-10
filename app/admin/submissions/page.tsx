"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, UserCircle, MapPin, Calendar, Filter, Recycle, Eye, Download, Coins, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Submission {
  id: string;
  userId: string;
  wasteType: string;
  imageUrl: string;
  imagePath: string;
  imageSize?: number;
  imageMimeType?: string;
  location: string;
  pointsAwarded: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    level?: string;
  };
}

export default function SubmissionsPage() {
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    try {
      console.log('🚀 Fetching admin submissions...');
      setLoading(true);
      const response = await fetch('/api/submissions/all');

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API Error Response:', error);

        if (response.status === 403) {
          toast({
            title: "❌ Access Denied",
            description: `You need admin privileges. Your role: ${error.currentRole || 'Unknown'}`,
            variant: "destructive",
          });
          return;
        }

        if (response.status === 404) {
          toast({
            title: "❌ User Not Found",
            description: `You don't exist in the database. User ID: ${error.userId}`,
            variant: "destructive",
          });
          return;
        }

        throw new Error(error.error || 'Failed to fetch submissions');
      }

      const data = await response.json();
      console.log('✅ API Response:', {
        submissionsCount: data.submissions?.length || 0,
        total: data.total,
        limit: data.limit,
        offset: data.offset,
      });

      if (data.submissions && data.submissions.length > 0) {
        console.log('First submission sample:', {
          id: data.submissions[0].id,
          wasteType: data.submissions[0].wasteType,
          imageUrl: data.submissions[0].imageUrl,
          hasUser: !!data.submissions[0].user,
          userName: data.submissions[0].user?.name,
        });
      } else {
        console.warn('⚠️ No submissions returned from API');
      }

      const fetchedSubmissions = data.submissions || [];
      setSubmissions(fetchedSubmissions);

      toast({
        title: "✅ Submissions Loaded",
        description: `Found ${data.submissions?.length || 0} submissions`,
      });
    } catch (error) {
      console.error('❌ Error in fetchSubmissions:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Fetch submissions completed');
    }
  }, [toast]);

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesFilter = filter === "ALL" || sub.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = async (id: string, userName: string) => {
    try {
      const customPoints = pointsInput[id] || 50;
      const response = await fetch(`/api/submissions/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED', points: customPoints }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify submission');
      }

      toast({
        title: "✅ Submission Verified",
        description: `${userName}'s submission has been approved!`,
      });

      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Error verifying:', error);
      toast({
        title: "❌ Error",
        description: "Failed to verify submission",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, userName: string) => {
    try {
      const response = await fetch(`/api/submissions/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: 'Image quality or waste type does not meet requirements',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject submission');
      }

      toast({
        title: "❌ Submission Rejected",
        description: `${userName}'s submission has been rejected.`,
        variant: "destructive",
      });

      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast({
        title: "❌ Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    }
  };

  const downloadImage = (imageUrl: string, wasteType: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${wasteType.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}'s submission? This will also delete the photo permanently.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete submission');
      }

      toast({
        title: "🗑️ Submission Deleted",
        description: `${userName}'s submission and photo have been permanently deleted.`,
      });

      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submissions Management</h1>
        <p className="text-gray-600 mt-1">Review and verify waste recycling submissions</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Submissions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <select className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <select className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600">
                <option value="all">All Locations</option>
                <option value="hyderabad">Hyderabad</option>
                <option value="warangal">Warangal</option>
                <option value="nizamabad">Nizamabad</option>
                <option value="karimnagar">Karimnagar</option>
                <option value="khammam">Khammam</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">User Search</label>
              <Input
                type="text"
                placeholder="Search by user name..."
                className="rounded-lg shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-end">
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full sm:w-auto">Apply Filters</Button>
            <Button variant="secondary" onClick={() => { setFilter("ALL"); setSearchTerm(""); }} className="w-full sm:w-auto">Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Recycle className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading submissions...</span>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={viewingImage}
              alt="Full size image"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              className="absolute top-4 right-4 bg-white text-black hover:bg-gray-200"
              onClick={() => setViewingImage(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Submissions Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => {
            const isPending = submission.status === 'PENDING';
            const isVerified = submission.status === 'VERIFIED';
            const isRejected = submission.status === 'REJECTED';

            return (
              <div
                key={submission.id}
                className={`overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${isPending ? 'border-amber-400 bg-[#fffdf5]' :
                    isVerified ? 'border-emerald-400 bg-[#f2fdf7]' :
                      'border-red-400 bg-[#fff5f5]'
                  }`}
              >
                {/* Card Header matching screenshot */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-600 shadow-sm flex-shrink-0">
                      {submission.user?.name ? submission.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">{submission.user?.name || 'Unknown User'}</h3>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{submission.userId || 'USR000'} • {submission.user?.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-sm flex-shrink-0
                    ${isPending ? 'bg-amber-500' : isVerified ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {submission.status}
                  </span>
                </div>

                {/* Submissions Image */}
                <div className="px-4 pb-4">
                  <div className="relative h-48 w-full rounded-xl overflow-hidden group/image border border-gray-100">
                    <Image
                      src={submission.imageUrl}
                      alt={submission.wasteType}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <Button size="sm" variant="secondary" onClick={() => setViewingImage(submission.imageUrl)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => downloadImage(submission.imageUrl, submission.wasteType)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Formatted Key-Value Details */}
                <div className="px-5 pb-5 space-y-3.5">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200/40">
                    <span className="text-sm text-gray-500 font-medium">Waste Type:</span>
                    <span className="text-sm font-semibold text-gray-900">{submission.wasteType}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200/40">
                    <span className="text-sm text-gray-500 font-medium">Location:</span>
                    <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px] text-right">{submission.location}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200/40">
                    <span className="text-sm text-gray-500 font-medium">Submitted:</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date(submission.createdAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200/40">
                    <span className="text-sm text-gray-500 font-medium">Points:</span>
                    <span className="text-sm font-bold text-gray-900">{submission.pointsAwarded || 0}</span>
                  </div>
                  <div className="flex justify-between items-start pb-2">
                    <span className="text-sm text-gray-500 font-medium min-w-max mr-4">Description:</span>
                    <span className="text-xs font-medium text-gray-900 text-right leading-relaxed line-clamp-2" title={(submission as any).description}>
                      {(submission as any).description || `A verified submission of ${submission.wasteType.toLowerCase()} to process.`}
                    </span>
                  </div>

                  {/* Action Section */}
                  {isPending ? (
                    <div className="space-y-3 pt-2 mt-2">
                      <Input
                        type="number"
                        placeholder="25"
                        min={0}
                        max={100}
                        className="bg-white rounded-lg border-gray-300 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                        value={pointsInput[submission.id] !== undefined ? pointsInput[submission.id] : 25}
                        onChange={(e) => setPointsInput({ ...pointsInput, [submission.id]: parseInt(e.target.value) || 0 })}
                      />
                      <div className="flex gap-2 w-full">
                        <Button
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm font-medium h-9 px-2"
                          onClick={() => handleVerify(submission.id, submission.user?.name || 'User')}
                        >
                          <CheckCircle2 className="h-4 w-4 sm:mr-1.5 hidden sm:inline-block" />
                          Verify
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-sm font-medium h-9 px-2"
                          onClick={() => handleReject(submission.id, submission.user?.name || 'User')}
                        >
                          <XCircle className="h-4 w-4 sm:mr-1.5 hidden sm:inline-block" />
                          Reject
                        </Button>
                        <Button
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm font-medium h-9 px-2 flex-col leading-none"
                          onClick={() => {
                            toast({
                              title: "✅ Points Assigned",
                              description: `${pointsInput[submission.id] || 25} points structured for verification.`
                            });
                          }}
                        >
                          Assign<br /><span className="text-[10px]">Points</span>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 font-medium h-9"
                        onClick={() => handleDelete(submission.id, submission.user?.name || 'User')}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete Submission
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 mt-2 space-y-2">
                      <div className="w-full bg-black/20 text-black/40 py-2 rounded-lg text-center font-bold text-sm select-none">
                        ✓ {submission.status.substring(0, 1) + submission.status.substring(1).toLowerCase()}
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 font-medium h-9"
                        onClick={() => handleDelete(submission.id, submission.user?.name || 'User')}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Delete Submission
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredSubmissions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No submissions found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}