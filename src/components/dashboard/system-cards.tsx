import { cn } from "@/lib/utils";
import { SYSTEM_ALERTS, SYSTEM_HEALTH } from "@/lib/system";
import { Card } from "@/components/ui/card";

export function SystemAlertsCard({ mobile }: { mobile?: boolean }) {
  return (
    <Card className={cn("flex w-full flex-col", mobile ? "gap-3 p-4" : "gap-4 p-5")}>
      <h2 className={cn("font-bold text-slate-900", mobile ? "text-sm" : "text-base")}>System Alerts</h2>
      <ul className="flex flex-col gap-3">
        {SYSTEM_ALERTS.map((a) =>
          mobile ? (
            <li key={a.title} className="flex items-start gap-2.5">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", a.dot)} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-xs font-semibold text-slate-900">{a.mobileTitle}</p>
                <p className="text-[11px] text-slate-600">{a.description}</p>
                <p className="text-[10px] text-slate-400">{a.time}</p>
              </div>
            </li>
          ) : (
            <li key={a.title} className="relative flex gap-3">
              <span className={cn("absolute left-0 top-1.5 size-2 rounded-full", a.dot)} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pl-4">
                <p className="text-[13px] font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-600">{a.description}</p>
                <p className="text-[11px] text-slate-400">{a.time}</p>
              </div>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}

export function SystemHealthCard({ mobile }: { mobile?: boolean }) {
  const rows = mobile ? SYSTEM_HEALTH.slice(0, 2) : SYSTEM_HEALTH;
  return (
    <Card className={cn("flex w-full flex-col", mobile ? "gap-3 p-4" : "gap-4 p-5")}>
      <h2 className={cn("font-bold text-slate-900", mobile ? "text-sm" : "text-base")}>System Health</h2>
      <dl className={cn("flex flex-col", mobile ? "gap-2 text-xs" : "gap-2.5 text-[13px]")}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              "flex justify-between",
              mobile ? "items-start" : "items-center py-1",
              !mobile && i < rows.length - 1 && "border-b border-slate-200",
            )}
          >
            <dt className="text-slate-600">{r.label}</dt>
            <dd className="font-semibold text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
