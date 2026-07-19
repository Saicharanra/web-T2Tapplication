export interface BinDocument {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  locationType: string;
  photoUrl: string;
  addedBy: string;
  createdAt: string | Date;
  distance?: number; // Runtime calculated distance in km
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => void;
}
