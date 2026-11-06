import { Stamp } from "@/components/ui/badge";
import type { Availability } from "@/convex/lib/tools";
import { formatDate } from "@/lib/format";

export function AvailabilityStamp({ availability }: { availability: Availability }) {
  switch (availability.state) {
    case "available":
      return <Stamp tone="success">Available</Stamp>;
    case "on_loan":
      return <Stamp tone="info">Out until {formatDate(availability.dueDate!)}</Stamp>;
    case "overdue":
      return <Stamp tone="danger">Overdue</Stamp>;
  }
}
