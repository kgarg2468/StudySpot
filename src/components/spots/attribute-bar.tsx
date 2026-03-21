import { getAttributeLabel } from "@/lib/constants";

interface AttributeBarProps {
  label: string;
  avg: number;
  attributeKey: string;
}

export function AttributeBar({ label, avg, attributeKey }: AttributeBarProps) {
  const valueLabel = getAttributeLabel(attributeKey, avg);
  const percentage = (avg / 5) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-medium">{valueLabel}</span>
      </div>
      <div className="h-1.5 bg-card-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/60 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
