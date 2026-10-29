import { DIET_DOT, DIET_LABEL, type Diet } from "@/lib/labels";

/** Indian-style veg/non-veg marker: coloured dot in a square, with a text label for screen readers. */
export function DietDot({ diet, className = "" }: { diet: Diet; className?: string }) {
  return (
    <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-current ${diet === "nonveg" ? "text-danger" : diet === "egg" ? "text-warning" : "text-success"} ${className}`} title={DIET_LABEL[diet]}>
      <span className={`h-1.5 w-1.5 rounded-full ${DIET_DOT[diet]}`} />
      <span className="sr-only">{DIET_LABEL[diet]}</span>
    </span>
  );
}
