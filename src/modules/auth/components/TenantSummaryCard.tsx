import { Building2, IdCard, KeyRound, Layers3 } from "lucide-react";
import { type AccessSession } from "@/modules/auth/types/auth.types";
import { Badge, Card } from "@/shared/ui";

type TenantSummaryCardProps = {
  session: AccessSession;
};

export function TenantSummaryCard({ session }: TenantSummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="grid gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="success">Tenant connected</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              {session.company?.name ?? session.label ?? "Fluxo access"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your workspace is authenticated through an enterprise access key.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <KeyRound className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBlock
            icon={<Building2 className="h-4 w-4" />}
            label="Company"
            value={session.company ? `${session.company.name} (${session.company.slug})` : "No company attached"}
          />
          <InfoBlock icon={<IdCard className="h-4 w-4" />} label="Plan" value={`${session.plan.name} (${session.plan.code})`} />
        </div>

        <div className="h-px bg-border" />

        <div>
          <p className="font-semibold">Enabled modules</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {session.modules.map((moduleName) => (
              <Badge key={moduleName} tone="outline" className="gap-2">
                <Layers3 className="h-3.5 w-3.5" />
                {moduleName}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">{icon}</div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
