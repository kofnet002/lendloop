import { Badge } from "@/components/ui/badge";
import type { Availability } from "@/convex/lib/tools";
import { formatDate } from "@/lib/format";

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  switch (availability.state) {
    case "available":
      return <Badge tone="success">Available</Badge>;
    case "on_loan":
      return <Badge tone="warning">On loan until {formatDate(availability.dueDate!)}</Badge>;
    case "overdue":
      return <Badge tone="danger">Overdue since {formatDate(availability.dueDate!)}</Badge>;
  }
}
