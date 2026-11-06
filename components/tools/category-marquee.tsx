import { CATEGORY_OPTIONS } from "@/lib/labels";
import { CategoryIcon } from "./category";

/** A hazard-taped band of every category, scrolling like a hardware-store ticker. */
export function CategoryMarquee() {
  const items = [...CATEGORY_OPTIONS, ...CATEGORY_OPTIONS];

  return (
    <div className="border-y-2 border-navy bg-yellow text-navy" aria-hidden>
      <div className="hazard h-2" />
      <div className="overflow-hidden py-3">
        <ul className="marquee flex w-max gap-10 pr-10 hover:[animation-play-state:paused]">
          {items.map(({ value, label }, index) => (
            <li key={`${value}-${index}`} className="flex items-center gap-3 text-lg font-bold">
              <CategoryIcon category={value} className="size-9 border-2 border-navy" />
              {label}
            </li>
          ))}
        </ul>
      </div>
      <div className="hazard h-2" />
    </div>
  );
}
