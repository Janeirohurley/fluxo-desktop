import { useState } from "react";
import { ArrowLeft, FolderTree, ListChecks, Wrench } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useAssetCategoriesReference,
  useAssetInterventionTypesReference,
  useAssetStatusesReference,
  useCreateAssetCategory,
  useCreateAssetStatus,
  useCreateInterventionType,
  useDeleteAssetCategory,
  useDeleteAssetStatus,
  useDeleteInterventionType,
  useUpdateAssetCategory,
  useUpdateAssetStatus,
  useUpdateInterventionType,
} from "@/modules/assets/hooks/useAssetReferences";
import { ReferenceTableSection } from "@/modules/assets/components/ReferenceTableSection";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { Button, Card } from "@/shared/ui";

type ReferenceSectionKey = "categories" | "statuses" | "interventionTypes";

export function AssetReferencesPage() {
  const { t } = useTranslation("assets");
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ReferenceSectionKey>("categories");

  const categoriesQuery = useAssetCategoriesReference();
  const statusesQuery = useAssetStatusesReference();
  const interventionTypesQuery = useAssetInterventionTypesReference();

  const createCategory = useCreateAssetCategory();
  const updateCategory = useUpdateAssetCategory();
  const deleteCategory = useDeleteAssetCategory();

  const createStatus = useCreateAssetStatus();
  const updateStatus = useUpdateAssetStatus();
  const deleteStatus = useDeleteAssetStatus();

  const createInterventionType = useCreateInterventionType();
  const updateInterventionType = useUpdateInterventionType();
  const deleteInterventionType = useDeleteInterventionType();

  const categories = categoriesQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const interventionTypes = interventionTypesQuery.data ?? [];

  const sections = [
    {
      key: "categories" as const,
      icon: FolderTree,
      count: categories.length,
    },
    {
      key: "statuses" as const,
      icon: ListChecks,
      count: statuses.length,
    },
    {
      key: "interventionTypes" as const,
      icon: Wrench,
      count: interventionTypes.length,
    },
  ];

  return (
    <section className="grid gap-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/assets" })}>
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
          <SummaryStatCard label={t("references.stats.categories")} value={categories.length} icon={<FolderTree className="h-6 w-6" />} />
          <SummaryStatCard label={t("references.stats.statuses")} value={statuses.length} icon={<ListChecks className="h-6 w-6" />} />
          <SummaryStatCard
            label={t("references.stats.interventionTypes")}
            value={interventionTypes.length}
            icon={<Wrench className="h-6 w-6" />}
          />
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

      {activeSection === "categories" ? (
        <ReferenceTableSection
          sectionKey="categories"
          tableId="asset-categories-table"
          data={categories}
          isLoading={categoriesQuery.isLoading || createCategory.isPending || updateCategory.isPending || deleteCategory.isPending}
          error={categoriesQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createCategory.mutateAsync({ name })}
          onUpdate={(id, name) => updateCategory.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteCategory.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "statuses" ? (
        <ReferenceTableSection
          sectionKey="statuses"
          tableId="asset-statuses-table"
          data={statuses}
          isLoading={statusesQuery.isLoading || createStatus.isPending || updateStatus.isPending || deleteStatus.isPending}
          error={statusesQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createStatus.mutateAsync({ name })}
          onUpdate={(id, name) => updateStatus.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteStatus.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "interventionTypes" ? (
        <ReferenceTableSection
          sectionKey="interventionTypes"
          tableId="asset-intervention-types-table"
          data={interventionTypes}
          isLoading={
            interventionTypesQuery.isLoading ||
            createInterventionType.isPending ||
            updateInterventionType.isPending ||
            deleteInterventionType.isPending
          }
          error={interventionTypesQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createInterventionType.mutateAsync({ name })}
          onUpdate={(id, name) => updateInterventionType.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteInterventionType.mutateAsync(row.id)}
        />
      ) : null}
    </section>
  );
}
