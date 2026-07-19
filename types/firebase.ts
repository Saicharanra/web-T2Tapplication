export type Role = 'USER' | 'ADMIN';
export type Level = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type Status = 'ACTIVE' | 'INACTIVE';
export type SubmissionStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserDocument {
  id: string; // Supabase User ID (stored in localStorage after OTP login)
  name: string;
  email: string;
  imageUrl?: string | null;
  role: Role;
  location?: string | null;
  level: Level;
  points: number;
  status: Status;
  joinedAt: string | Date;
  updatedAt: string | Date;
}

export interface SubmissionDocument {
  id?: string; // Auto-generated UUID
  userId: string;
  wasteType: string;
  imageUrl: string;
  imagePath: string;
  imageSize?: number;
  imageMimeType?: string;
  pointsAwarded: number;
  status: SubmissionStatus;
  location: string;
  createdAt: string | Date;
  verifiedAt?: string | Date | null;
  assignedAdminId?: string | null;
  rejectionReason?: string | null;
}

export interface PointsHistoryDocument {
  id?: string;
  userId: string;
  submissionId: string;
  points: number;
  createdAt: string | Date;
}
