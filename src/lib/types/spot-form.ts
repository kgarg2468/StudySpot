import type { Category } from "./database";

export interface SpotFormData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  name: string;
  category: Category | "";
  description: string;
  hours: string;
  is_indoor: boolean | null;
  student_discount: string;
  photo: File | null;
  overall: number;
  noise_level: number | null;
  seating_availability: number | null;
  wifi_quality: number | null;
  outlet_availability: number | null;
  food_drink: number | null;
  vibe: number | null;
  group_friendly: number | null;
  comment: string;
}

export const INITIAL_FORM: SpotFormData = {
  latitude: null,
  longitude: null,
  address: "",
  name: "",
  category: "",
  description: "",
  hours: "",
  is_indoor: null,
  student_discount: "",
  photo: null,
  overall: 0,
  noise_level: null,
  seating_availability: null,
  wifi_quality: null,
  outlet_availability: null,
  food_drink: null,
  vibe: null,
  group_friendly: null,
  comment: "",
};
