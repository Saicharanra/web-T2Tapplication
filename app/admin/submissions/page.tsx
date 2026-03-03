"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, UserCircle, MapPin, Calendar, Filter, Recycle, Eye, Download } from "lucide-react";
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

      setSubmissions(data.submissions || []);

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
      const response = await fetch(`/api/submissions/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED', points: 50 }),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submissions Management</h1>
        <p className="text-gray-600 mt-1">Review and verify waste recycling submissions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            <div className="flex gap-2">
              {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Search by user, location, or waste type..."
              className="max-w-md ml-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          {filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative h-48 bg-gray-200 overflow-hidden group/image">
                <Image
                  src={submission.imageUrl}
                  alt={submission.wasteType}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                  <Button
                    size="sm"
                    className="mr-2"
                    onClick={() => setViewingImage(submission.imageUrl)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(submission.imageUrl, submission.wasteType)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${submission.status === "VERIFIED"
                        ? "bg-green-500 text-white"
                        : submission.status === "PENDING"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                  >
                    {submission.status}
                  </span>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{submission.wasteType}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <UserCircle className="h-4 w-4" />
                    <span>{submission.user?.name || 'Unknown User'}</span>
                  </div>
                  {submission.user?.email && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {submission.user.email}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{submission.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl">🪙</span>
                    <span className="font-bold text-lg text-green-600">{submission.pointsAwarded}</span>
                    <span className="text-sm text-gray-500">points</span>
                  </div>
                  {submission.imageSize && (
                    <div className="text-xs text-gray-500">
                      {(submission.imageSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>

                {submission.status === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => handleVerify(submission.id, submission.user?.name || 'User')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                      onClick={() => handleReject(submission.id, submission.user?.name || 'User')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
