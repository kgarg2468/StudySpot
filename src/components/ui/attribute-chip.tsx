import { getAttributeLabel } from "@/lib/constants";

interface AttributeChipProps {
  attributeKey: string;
  avg: number;
}

export function AttributeChip({ attributeKey, avg }: AttributeChipProps) {
  const label = getAttributeLabel(attributeKey, avg);
  if (!label) return null;

  return (
    <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-tag bg-card-secondary rounded-full border border-border">
      {label}
    </span>
  );
}
