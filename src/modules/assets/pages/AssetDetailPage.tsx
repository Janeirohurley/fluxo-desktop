import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Boxes, CircleDollarSign, ShieldCheck, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  createAssetAssignment,
  createAssetMaintenanceLog,
  upsertAssetFinance,
} from "@/modules/assets/api/assets.api";
import {
  assetsQueryKeys,
  useAssetDetail,
  useEmployeeOptions,
  useInterventionTypes,
  useLocationOptions,
} from "@/modules/assets/hooks/useAssets";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field, Spinner } from "@/shared/ui";

type AssetDetailPageProps = {
  assetId: string;
};

type SectionKey = "overview" | "finance" | "assignments" | "maintenance";

type FinanceFormState = {
  acquisitionDate: string;
  purchaseValue: string;
  estimatedLifeYears: string;
  residualValue: string;
};

type AssignmentFormState = {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
};

type MaintenanceFormState = {
  interventionTypeId: string;
  description: string;
  interventionCost: string;
  provider: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function AssetDetailPage({ assetId }: AssetDetailPageProps) {
  const { t } = useTranslation("assets");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [financeForm, setFinanceForm] = useState<FinanceFormState>({
    acquisitionDate: "",
    purchaseValue: "",
    estimatedLifeYears: "",
    residualValue: "",
  });
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>({
    employeeId: "",
    locationId: "",
    startDate: "",
    endDate: "",
  });
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceFormState>({
    interventionTypeId: "",
    description: "",
    interventionCost: "",
    provider: "",
  });

  const assetQuery = useAssetDetail(assetId);
  const employeesQuery = useEmployeeOptions();
  const locationsQuery = useLocationOptions();
  const interventionTypesQuery = useInterventionTypes();

  const asset = assetQuery.data;
  const employees = employeesQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const interventionTypes = interventionTypesQuery.data ?? [];

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const locationMap = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  );
  const interventionTypeMap = useMemo(
    () => new Map(interventionTypes.map((item) => [item.id, item])),
    [interventionTypes],
  );

  useEffect(() => {
    if (!asset) {
      return;
    }

    setFinanceForm({
      acquisitionDate: asset.financeData?.acquisitionDate ?? "",
      purchaseValue: asset.financeData?.purchaseValue != null ? String(asset.financeData.purchaseValue) : "",
      estimatedLifeYears:
        asset.financeData?.estimatedLifeYears != null ? String(asset.financeData.estimatedLifeYears) : "",
      residualValue: asset.financeData?.residualValue != null ? String(asset.financeData.residualValue) : "",
    });
    setAssignmentForm((prev) => ({
      employeeId: prev.employeeId || employees[0]?.id || "",
      locationId: prev.locationId || locations[0]?.id || "",
      startDate: prev.startDate,
      endDate: prev.endDate,
    }));
    setMaintenanceForm((prev) => ({
      interventionTypeId: prev.interventionTypeId || interventionTypes[0]?.id || "",
      description: prev.description,
      interventionCost: prev.interventionCost,
      provider: prev.provider,
    }));
  }, [asset, employees, locations, interventionTypes]);

  const refreshAsset = async () => {
    await queryClient.invalidateQueries({ queryKey: ["assets"] });
    await queryClient.invalidateQueries({ queryKey: assetsQueryKeys.detail(assetId) });
  };

  const handleSaveFinance = async () => {
    if (!financeForm.acquisitionDate || !financeForm.purchaseValue || !financeForm.estimatedLifeYears) {
      notify.error(t("detail.finance.validationError"));
      return;
    }

    setIsSavingFinance(true);

    try {
      await upsertAssetFinance(assetId, {
        acquisitionDate: financeForm.acquisitionDate,
        purchaseValue: Number(financeForm.purchaseValue),
        estimatedLifeYears: Number(financeForm.estimatedLifeYears),
        residualValue: financeForm.residualValue ? Number(financeForm.residualValue) : undefined,
      });
      notify.success(t("detail.finance.success"));
      await refreshAsset();
    } catch (error) {
      console.error(error);
      notify.error(t("detail.finance.error"));
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.employeeId || !assignmentForm.locationId || !assignmentForm.startDate) {
      notify.error(t("detail.assignments.validationError"));
      return;
    }

    setIsSavingAssignment(true);

    try {
      await createAssetAssignment(assetId, {
        employeeId: assignmentForm.employeeId,
        locationId: assignmentForm.locationId,
        startDate: assignmentForm.startDate,
        endDate: assignmentForm.endDate || undefined,
      });
      notify.success(t("detail.assignments.success"));
      setAssignmentForm({
        employeeId: employees[0]?.id ?? "",
        locationId: locations[0]?.id ?? "",
        startDate: "",
        endDate: "",
      });
      await refreshAsset();
    } catch (error) {
      console.error(error);
      notify.error(t("detail.assignments.error"));
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleCreateMaintenance = async () => {
    if (!maintenanceForm.interventionTypeId) {
      notify.error(t("detail.maintenance.validationError"));
      return;
    }

    setIsSavingMaintenance(true);

    try {
      await createAssetMaintenanceLog(assetId, {
        interventionTypeId: maintenanceForm.interventionTypeId,
        description: maintenanceForm.description || undefined,
        interventionCost: maintenanceForm.interventionCost ? Number(maintenanceForm.interventionCost) : undefined,
        provider: maintenanceForm.provider || undefined,
      });
      notify.success(t("detail.maintenance.success"));
      setMaintenanceForm({
        interventionTypeId: interventionTypes[0]?.id ?? "",
        description: "",
        interventionCost: "",
        provider: "",
      });
      await refreshAsset();
    } catch (error) {
      console.error(error);
      notify.error(t("detail.maintenance.error"));
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  if (assetQuery.isLoading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="grid justify-items-center gap-4 text-center">
          <Spinner className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{t("detail.loadingTitle")}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.loadingDescription")}</p>
          </div>
        </div>
      </section>
    );
  }

  if (assetQuery.isError || !asset) {
    return (
      <section className="grid gap-4">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/assets" })}>
          {t("detail.back")}
        </Button>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("detail.errorTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("detail.errorDescription")}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/assets" })}>
          {t("detail.back")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{asset.name}</h1>
              {asset.status ? <Badge tone="info">{asset.status.name}</Badge> : null}
              {asset.category ? <Badge tone="outline">{asset.category.name}</Badge> : null}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {asset.inventoryCode} · {asset.brand || t("table.na")} · {asset.model || t("table.na")}
            </p>
          </div>
          <div className="grid gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span>{t("detail.lastUpdated")}</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatDate(asset.updatedAt)}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("detail.stats.finance")} value={asset.financeData ? t("detail.labels.configured") : t("detail.labels.missing")} icon={<CircleDollarSign className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.stats.assignments")} value={asset.assignments.length} icon={<ShieldCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.stats.maintenance")} value={asset.maintenanceLogs.length} icon={<Wrench className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.stats.identity")} value={asset.serialNumber || t("table.na")} icon={<Boxes className="h-6 w-6" />} />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["overview", "finance", "assignments", "maintenance"] as SectionKey[]).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeSection === section ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {t(`detail.sections.${section}`)}
            </button>
          ))}
        </div>
      </Card>

      {activeSection === "overview" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.overview.identityTitle")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("detail.overview.inventoryCode")} value={asset.inventoryCode} readOnly />
              <Field label={t("detail.overview.serialNumber")} value={asset.serialNumber || t("table.na")} readOnly />
              <Field label={t("detail.overview.brand")} value={asset.brand || t("table.na")} readOnly />
              <Field label={t("detail.overview.model")} value={asset.model || t("table.na")} readOnly />
              <Field label={t("detail.overview.category")} value={asset.category?.name || t("table.na")} readOnly />
              <Field label={t("detail.overview.status")} value={asset.status?.name || t("table.na")} readOnly />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.overview.relationshipsTitle")}</h2>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("detail.stats.finance")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {asset.financeData ? `${formatCurrency(asset.financeData.purchaseValue)} · ${formatDate(asset.financeData.acquisitionDate)}` : t("detail.labels.missing")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("detail.stats.assignments")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{asset.assignments.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("detail.stats.maintenance")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{asset.maintenanceLogs.length}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "finance" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.finance.title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("detail.finance.acquisitionDate")}
                type="date"
                value={financeForm.acquisitionDate}
                onChange={(event) => setFinanceForm((prev) => ({ ...prev, acquisitionDate: event.target.value }))}
              />
              <Field
                label={t("detail.finance.purchaseValue")}
                type="number"
                value={financeForm.purchaseValue}
                onChange={(event) => setFinanceForm((prev) => ({ ...prev, purchaseValue: event.target.value }))}
              />
              <Field
                label={t("detail.finance.estimatedLifeYears")}
                type="number"
                value={financeForm.estimatedLifeYears}
                onChange={(event) => setFinanceForm((prev) => ({ ...prev, estimatedLifeYears: event.target.value }))}
              />
              <Field
                label={t("detail.finance.residualValue")}
                type="number"
                value={financeForm.residualValue}
                onChange={(event) => setFinanceForm((prev) => ({ ...prev, residualValue: event.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void handleSaveFinance()} disabled={isSavingFinance}>
                {isSavingFinance ? t("detail.finance.saving") : t("detail.finance.submit")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.finance.snapshotTitle")}</h3>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("detail.finance.purchaseValue")}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(asset.financeData?.purchaseValue)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("detail.finance.residualValue")}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(asset.financeData?.residualValue)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("detail.finance.acquisitionDate")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatDate(asset.financeData?.acquisitionDate)}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "assignments" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.assignments.title")}</h2>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.assignments.employee")}</span>
                <select
                  value={assignmentForm.employeeId}
                  onChange={(event) => setAssignmentForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("detail.assignments.employeePlaceholder")}</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.employeeNumber})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.assignments.location")}</span>
                <select
                  value={assignmentForm.locationId}
                  onChange={(event) => setAssignmentForm((prev) => ({ ...prev, locationId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("detail.assignments.locationPlaceholder")}</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label={t("detail.assignments.startDate")}
                type="date"
                value={assignmentForm.startDate}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
              <Field
                label={t("detail.assignments.endDate")}
                type="date"
                value={assignmentForm.endDate}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void handleCreateAssignment()} disabled={isSavingAssignment}>
                {isSavingAssignment ? t("detail.assignments.saving") : t("detail.assignments.submit")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.assignments.historyTitle")}</h3>
            {asset.assignments.length > 0 ? (
              asset.assignments.map((assignment) => {
                const employee = employeeMap.get(assignment.employeeId);
                const location = locationMap.get(assignment.locationId);

                return (
                  <div key={assignment.id} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {employee?.fullName ?? assignment.employeeId}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {location?.name ?? assignment.locationId}
                        </p>
                      </div>
                      <Badge tone="outline">
                        {formatDate(assignment.startDate)} - {assignment.endDate ? formatDate(assignment.endDate) : t("detail.labels.ongoing")}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.assignments.empty")}</p>
            )}
          </div>
        </Card>
      ) : null}

      {activeSection === "maintenance" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.maintenance.title")}</h2>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.maintenance.interventionType")}</span>
                <select
                  value={maintenanceForm.interventionTypeId}
                  onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, interventionTypeId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("detail.maintenance.typePlaceholder")}</option>
                  {interventionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label={t("detail.maintenance.description")}
                value={maintenanceForm.description}
                onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <Field
                label={t("detail.maintenance.provider")}
                value={maintenanceForm.provider}
                onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, provider: event.target.value }))}
              />
              <Field
                label={t("detail.maintenance.interventionCost")}
                type="number"
                value={maintenanceForm.interventionCost}
                onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, interventionCost: event.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void handleCreateMaintenance()} disabled={isSavingMaintenance}>
                {isSavingMaintenance ? t("detail.maintenance.saving") : t("detail.maintenance.submit")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.maintenance.historyTitle")}</h3>
            {asset.maintenanceLogs.length > 0 ? (
              asset.maintenanceLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {interventionTypeMap.get(log.interventionTypeId)?.name ?? log.interventionTypeId}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{log.provider || t("table.na")}</p>
                    </div>
                    <Badge tone="outline">{formatDate(log.createdAt)}</Badge>
                  </div>
                  {log.description ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{log.description}</p> : null}
                  <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                    {t("detail.maintenance.interventionCost")}: {formatCurrency(log.interventionCost)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.maintenance.empty")}</p>
            )}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
