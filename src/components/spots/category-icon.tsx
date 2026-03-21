import {
  BookOpen,
  Coffee,
  Trees,
  Building2,
  MapPin,
  type LucideProps,
} from "lucide-react";
import type { Category } from "@/lib/types/database";

const CATEGORY_ICONS: Record<Category, React.FC<LucideProps>> = {
  Library: BookOpen,
  Cafe: Coffee,
  Outdoor: Trees,
  Building: Building2,
  Other: MapPin,
};

interface CategoryIconProps extends LucideProps {
  category: Category;
}

export function CategoryIcon({
  category,
  ...props
}: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category] ?? MapPin;
  return <Icon {...props} />;
}
