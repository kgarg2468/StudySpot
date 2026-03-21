export type Category = "Library" | "Cafe" | "Outdoor" | "Building" | "Other";
export type ReportTargetType = "spot" | "rating";
export type ReportStatus = "pending" | "reviewed" | "actioned";

export interface Profile {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Spot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string;
  category: Category;
  hours: string | null;
  is_indoor: boolean | null;
  student_discount: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface Rating {
  id: string;
  spot_id: string;
  user_id: string;
  overall: number;
  noise_level: number | null;
  seating_availability: number | null;
  wifi_quality: number | null;
  outlet_availability: number | null;
  food_drink: number | null;
  vibe: number | null;
  group_friendly: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Report {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reported_by: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface SpotStats {
  spot_id: string;
  rating_count: number;
  overall_avg: number | null;
  noise_avg: number | null;
  noise_count: number;
  seating_avg: number | null;
  seating_count: number;
  wifi_avg: number | null;
  wifi_count: number;
  outlet_avg: number | null;
  outlet_count: number;
  food_drink_avg: number | null;
  food_drink_count: number;
  vibe_avg: number | null;
  vibe_count: number;
  group_friendly_avg: number | null;
  group_friendly_count: number;
  recent_rating_count: number;
}

export interface SpotWithStats extends Spot {
  spot_stats: SpotStats[];
}

export interface RatingWithProfile extends Rating {
  profiles: Pick<Profile, "display_name"> | null;
}

// Supabase client Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      spots: {
        Row: Spot;
        Insert: Omit<Spot, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Spot>;
      };
      ratings: {
        Row: Rating;
        Insert: Omit<Rating, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Rating>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at" | "status"> & {
          id?: string;
          created_at?: string;
          status?: ReportStatus;
        };
        Update: Partial<Report>;
      };
    };
    Views: {
      spot_stats: {
        Row: SpotStats;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
