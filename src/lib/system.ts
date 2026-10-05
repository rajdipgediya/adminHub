/**
 * Operational data with no public-API equivalent (infrastructure alerts and
 * health metrics). Kept in one module so it can be swapped for a real
 * monitoring endpoint later.
 */
export const SYSTEM_ALERTS = [
  {
    title: "Server capacity at 92%",
    mobileTitle: "Server capacity at 92%",
    description: "Scale resources",
    time: "2 hours ago",
    dot: "bg-red-500",
  },
  {
    title: "15 transactions pending",
    mobileTitle: "15 transactions pending",
    description: "Pending review",
    time: "5 hours ago",
    dot: "bg-amber-500",
  },
  {
    title: "System maintenance scheduled",
    mobileTitle: "System maintenance",
    description: "Scheduled for Oct 5",
    time: "Yesterday",
    dot: "bg-blue-500",
  },
] as const;

export const SYSTEM_HEALTH = [
  { label: "Uptime", value: "99.8%" },
  { label: "Avg Response Time", value: "142ms" },
  { label: "Active Sessions", value: "3,241" },
] as const;
