import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, MapPinned, Shapes } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useCreateEmployeeLocation,
  useCreateEmployeePosition,
  useCreateEmployeeRole,
  useDeleteEmployeeLocation,
  useDeleteEmployeePosition,
  useDeleteEmployeeRole,
  useEmployeeLocationsReference,
  useEmployeePositionsReference,
  useEmployeeRolesReference,
  useUpdateEmployeeLocation,
  useUpdateEmployeePosition,
  useUpdateEmployeeRole,
} from "@/modules/employees/hooks/useEmployeeReferences";
import { ReferenceTableSection } from "@/modules/employees/components/ReferenceTableSection";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { Button, Card } from "@/shared/ui";

type ReferenceSectionKey = "roles" | "positions" | "locations";

export function EmployeeReferencesPage() {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ReferenceSectionKey>("roles");

  const rolesQuery = useEmployeeRolesReference();
  const positionsQuery = useEmployeePositionsReference();
  const locationsQuery = useEmployeeLocationsReference();

  const createRole = useCreateEmployeeRole();
  const updateRole = useUpdateEmployeeRole();
  const deleteRole = useDeleteEmployeeRole();

  const createPosition = useCreateEmployeePosition();
  const updatePosition = useUpdateEmployeePosition();
  const deletePosition = useDeleteEmployeePosition();

  const createLocation = useCreateEmployeeLocation();
  const updateLocation = useUpdateEmployeeLocation();
  const deleteLocation = useDeleteEmployeeLocation();

  const roles = rolesQuery.data ?? [];
  const positions = positionsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const sections = [
    { key: "roles" as const, icon: Shapes, count: roles.length },
    { key: "positions" as const, icon: BriefcaseBusiness, count: positions.length },
    { key: "locations" as const, icon: MapPinned, count: locations.length },
  ];

  return (
    <section className="grid gap-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/employees" })}>
          {t("references.back")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("references.title")}
          </h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("references.description")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryStatCard label={t("references.stats.roles")} value={roles.length} icon={<Shapes className="h-6 w-6" />} />
          <SummaryStatCard label={t("references.stats.positions")} value={positions.length} icon={<BriefcaseBusiness className="h-6 w-6" />} />
          <SummaryStatCard label={t("references.stats.locations")} value={locations.length} icon={<MapPinned className="h-6 w-6" />} />
        </div>

        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeSection === section.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(`references.sections.${section.key}.title`)}</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{section.count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {activeSection === "roles" ? (
        <ReferenceTableSection
          sectionKey="roles"
          tableId="employee-roles-table"
          data={roles}
          isLoading={rolesQuery.isLoading || createRole.isPending || updateRole.isPending || deleteRole.isPending}
          error={rolesQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createRole.mutateAsync({ name })}
          onUpdate={(id, name) => updateRole.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteRole.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "positions" ? (
        <ReferenceTableSection
          sectionKey="positions"
          tableId="employee-positions-table"
          data={positions}
          isLoading={positionsQuery.isLoading || createPosition.isPending || updatePosition.isPending || deletePosition.isPending}
          error={positionsQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createPosition.mutateAsync({ name })}
          onUpdate={(id, name) => updatePosition.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deletePosition.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "locations" ? (
        <ReferenceTableSection
          sectionKey="locations"
          tableId="employee-locations-table"
          data={locations}
          isLoading={locationsQuery.isLoading || createLocation.isPending || updateLocation.isPending || deleteLocation.isPending}
          error={locationsQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createLocation.mutateAsync({ name })}
          onUpdate={(id, name) => updateLocation.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteLocation.mutateAsync(row.id)}
        />
      ) : null}
    </section>
  );
}
