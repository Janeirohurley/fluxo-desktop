import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  BriefcaseBusiness,
  Download,
  MapPinned,
  Pencil,
  RotateCcw,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAssets } from "@/modules/assets/hooks/useAssets";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";
import {
  createEmployeeAssignment,
  createEmployeeContract,
  deleteEmployeeAssignment,
  deleteEmployeeContract,
  updateEmployeeAssignment,
  updateEmployeeContract,
} from "@/modules/employees/api/employees.api";
import { employeesQueryKeys, useEmployeeDetail } from "@/modules/employees/hooks/useEmployees";
import {
  useEmployeeLocationsReference,
  useEmployeePositionsReference,
  useEmployeeRolesReference,
} from "@/modules/employees/hooks/useEmployeeReferences";
import { usePayrollContractsByEmployee, usePaySlipsByEmployee } from "@/modules/payroll/hooks/usePayroll";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field, Spinner } from "@/shared/ui";

type EmployeeDetailPageProps = {
  employeeId: string;
};

type SectionKey = "overview" | "assets" | "payroll" | "assignments" | "contracts";

type AssignmentFormState = {
  roleId: string;
  positionId: string;
  locationId: string;
  startDate: string;
  endDate: string;
};

type ContractFormState = {
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  salaryAmount: string;
  currency: string;
  paymentFrequency: string;
};

const contractStatuses = ["draft", "active", "suspended", "terminated", "expired"] as const;
const paymentFrequencies = ["weekly", "biweekly", "monthly", "quarterly", "annual"] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value?: number | null, currency = "BIF") {
  if (typeof value !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: { message?: string } } }).response?.data?.message
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
  }

  return fallback;
}

export function EmployeeDetailPage({ employeeId }: EmployeeDetailPageProps) {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useAccessSession();
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const rolesQuery = useEmployeeRolesReference();
  const positionsQuery = useEmployeePositionsReference();
  const locationsQuery = useEmployeeLocationsReference();
  const detailQuery = useEmployeeDetail(employeeId);
  const employeeAssetsQuery = useAssets({
    page: 1,
    pageSize: 100,
    employeeId,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const payrollEnabled = session?.modules.includes("payroll") ?? false;
  const payrollContractsQuery = usePayrollContractsByEmployee(employeeId, payrollEnabled);
  const payrollPaySlipsQuery = usePaySlipsByEmployee(employeeId, payrollEnabled);

  const employee = detailQuery.data?.employee;
  const assignments = detailQuery.data?.assignments ?? [];
  const contracts = detailQuery.data?.contracts ?? [];
  const linkedAssets = employeeAssetsQuery.data?.results ?? [];
  const payrollContracts = payrollContractsQuery.data?.results ?? [];
  const payrollPaySlips = payrollPaySlipsQuery.data?.results ?? [];
  const latestPaySlip = payrollPaySlips[0] ?? null;
  const roles = rolesQuery.data ?? [];
  const positions = positionsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];

  const roleMap = useMemo(() => new Map(roles.map((item) => [item.id, item])), [roles]);
  const positionMap = useMemo(() => new Map(positions.map((item) => [item.id, item])), [positions]);
  const locationMap = useMemo(() => new Map(locations.map((item) => [item.id, item])), [locations]);

  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>({
    roleId: "",
    positionId: "",
    locationId: "",
    startDate: "",
    endDate: "",
  });
  const [contractForm, setContractForm] = useState<ContractFormState>({
    contractType: "",
    status: "active",
    startDate: "",
    endDate: "",
    salaryAmount: "",
    currency: "BIF",
    paymentFrequency: "monthly",
  });

  const buildDefaultAssignmentForm = (): AssignmentFormState => ({
    roleId: roles[0]?.id ?? "",
    positionId: positions[0]?.id ?? "",
    locationId: locations[0]?.id ?? "",
    startDate: "",
    endDate: "",
  });

  const buildDefaultContractForm = (): ContractFormState => ({
    contractType: "",
    status: "active",
    startDate: "",
    endDate: "",
    salaryAmount: "",
    currency: "BIF",
    paymentFrequency: "monthly",
  });

  useEffect(() => {
    if (!editingAssignmentId) {
      setAssignmentForm(buildDefaultAssignmentForm());
    }

    if (!editingContractId) {
      setContractForm(buildDefaultContractForm());
    }
  }, [editingAssignmentId, editingContractId, roles, positions, locations]);

  const refreshDetail = async () => {
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
    await queryClient.invalidateQueries({ queryKey: employeesQueryKeys.detail(employeeId) });
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.roleId || !assignmentForm.positionId || !assignmentForm.locationId || !assignmentForm.startDate) {
      notify.error(t("detail.assignments.validationError"));
      return;
    }

    setIsSavingAssignment(true);

    try {
      if (editingAssignmentId) {
        await updateEmployeeAssignment(employeeId, editingAssignmentId, {
          roleId: assignmentForm.roleId,
          positionId: assignmentForm.positionId,
          locationId: assignmentForm.locationId,
          startDate: assignmentForm.startDate,
          endDate: assignmentForm.endDate || undefined,
        });
        notify.success(t("detail.assignments.updateSuccess"));
      } else {
        await createEmployeeAssignment(employeeId, {
          roleId: assignmentForm.roleId,
          positionId: assignmentForm.positionId,
          locationId: assignmentForm.locationId,
          startDate: assignmentForm.startDate,
          endDate: assignmentForm.endDate || undefined,
        });
        notify.success(t("detail.assignments.success"));
      }

      setEditingAssignmentId(null);
      setAssignmentForm(buildDefaultAssignmentForm());
      await refreshDetail();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("detail.assignments.error")));
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteEmployeeAssignment(employeeId, assignmentId);

      if (editingAssignmentId === assignmentId) {
        setEditingAssignmentId(null);
        setAssignmentForm(buildDefaultAssignmentForm());
      }

      notify.success(t("detail.assignments.deleteSuccess"));
      await refreshDetail();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("detail.assignments.deleteError")));
    }
  };

  const handleSaveContract = async () => {
    if (!contractForm.contractType.trim() || !contractForm.startDate || !contractForm.salaryAmount.trim()) {
      notify.error(t("detail.contracts.validationError"));
      return;
    }

    setIsSavingContract(true);

    try {
      if (editingContractId) {
        await updateEmployeeContract(employeeId, editingContractId, {
          contractType: contractForm.contractType.trim(),
          status: contractForm.status,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate || undefined,
          salaryAmount: Number(contractForm.salaryAmount),
          currency: contractForm.currency,
          paymentFrequency: contractForm.paymentFrequency,
        });
        notify.success(t("detail.contracts.updateSuccess"));
      } else {
        await createEmployeeContract(employeeId, {
          contractType: contractForm.contractType.trim(),
          status: contractForm.status,
          startDate: contractForm.startDate,
          endDate: contractForm.endDate || undefined,
          salaryAmount: Number(contractForm.salaryAmount),
          currency: contractForm.currency,
          paymentFrequency: contractForm.paymentFrequency,
        });
        notify.success(t("detail.contracts.success"));
      }

      setEditingContractId(null);
      setContractForm(buildDefaultContractForm());
      await refreshDetail();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("detail.contracts.error")));
    } finally {
      setIsSavingContract(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await deleteEmployeeContract(employeeId, contractId);

      if (editingContractId === contractId) {
        setEditingContractId(null);
        setContractForm(buildDefaultContractForm());
      }

      notify.success(t("detail.contracts.deleteSuccess"));
      await refreshDetail();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("detail.contracts.deleteError")));
    }
  };

  const handleExportSummary = () => {
    if (!employee) {
      return;
    }

    const payload = {
      employee,
      assignments,
      contracts,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `employee-${employee.employeeNumber}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify.success(t("detail.exports.summarySuccess"));
  };

  if (detailQuery.isLoading) {
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

  if (detailQuery.isError || !employee) {
    return (
      <section className="grid gap-4">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/employees" })}>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/employees" })}>
          {t("detail.back")}
        </Button>
        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportSummary}>
          {t("detail.exports.summary")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{employee.fullName}</h1>
              <Badge tone={employee.status === "active" ? "success" : "outline"}>{t(`statuses.${employee.status}`)}</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {employee.employeeNumber} · {employee.email || t("table.na")} · {employee.phone || t("table.na")}
            </p>
          </div>
          <div className="grid gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span>{t("detail.lastUpdated")}</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatDate(employee.updatedAt)}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("detail.stats.status")} value={t(`statuses.${employee.status}`)} icon={<BadgeCheck className="h-6 w-6" />} />
          <SummaryStatCard
            label={t("detail.stats.assignment")}
            value={employee.currentAssignment ? employee.currentAssignment.position.name : t("detail.labels.missing")}
            icon={<UserRoundCog className="h-6 w-6" />}
          />
          <SummaryStatCard
            label={t("detail.stats.contract")}
            value={employee.activeContract ? employee.activeContract.contractType : t("detail.labels.missing")}
            icon={<BriefcaseBusiness className="h-6 w-6" />}
          />
          <SummaryStatCard label={t("detail.stats.linkedAssets")} value={linkedAssets.length} icon={<Box className="h-6 w-6" />} />
          {payrollEnabled ? (
            <SummaryStatCard
              label={t("detail.stats.payroll")}
              value={latestPaySlip ? t(`payrollStatuses.${latestPaySlip.status}`) : t("detail.labels.missing")}
              icon={<BriefcaseBusiness className="h-6 w-6" />}
            />
          ) : null}
          <SummaryStatCard label={t("detail.stats.hireDate")} value={formatDate(employee.hireDate)} icon={<MapPinned className="h-6 w-6" />} />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["overview", "assets", ...(payrollEnabled ? (["payroll"] as const) : []), "assignments", "contracts"] as SectionKey[]).map((section) => (
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
              <Field label={t("detail.overview.employeeNumber")} value={employee.employeeNumber} readOnly />
              <Field label={t("detail.overview.status")} value={t(`statuses.${employee.status}`)} readOnly />
              <Field label={t("detail.overview.firstName")} value={employee.firstName} readOnly />
              <Field label={t("detail.overview.lastName")} value={employee.lastName} readOnly />
              <Field label={t("detail.overview.email")} value={employee.email || t("table.na")} readOnly />
              <Field label={t("detail.overview.phone")} value={employee.phone || t("table.na")} readOnly />
              <Field label={t("detail.overview.hireDate")} value={formatDate(employee.hireDate)} readOnly />
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.overview.relationshipsTitle")}</h2>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("detail.stats.assignment")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {employee.currentAssignment
                    ? `${employee.currentAssignment.role.name} · ${employee.currentAssignment.position.name} · ${employee.currentAssignment.location.name}`
                    : t("detail.labels.missing")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("detail.stats.contract")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {employee.activeContract
                    ? `${employee.activeContract.contractType} · ${formatCurrency(employee.activeContract.salaryAmount, employee.activeContract.currency)}`
                    : t("detail.labels.missing")}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {activeSection === "assignments" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.assignments.title")}</h2>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.assignments.role")}</span>
              <select
                value={assignmentForm.roleId}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, roleId: event.target.value }))}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="">{t("detail.assignments.rolePlaceholder")}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.assignments.position")}</span>
              <select
                value={assignmentForm.positionId}
                onChange={(event) => setAssignmentForm((prev) => ({ ...prev, positionId: event.target.value }))}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="">{t("detail.assignments.positionPlaceholder")}</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
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

            <Field label={t("detail.assignments.startDate")} type="date" value={assignmentForm.startDate} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, startDate: event.target.value }))} />
            <Field label={t("detail.assignments.endDate")} type="date" value={assignmentForm.endDate} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, endDate: event.target.value }))} />

            <div className="flex justify-end gap-3">
              {editingAssignmentId ? (
                <Button
                  variant="secondary"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => {
                    setEditingAssignmentId(null);
                    setAssignmentForm(buildDefaultAssignmentForm());
                  }}
                >
                  {t("detail.actions.cancelEdit")}
                </Button>
              ) : null}
              <Button onClick={() => void handleSaveAssignment()} disabled={isSavingAssignment}>
                {isSavingAssignment
                  ? t("detail.assignments.saving")
                  : editingAssignmentId
                    ? t("detail.assignments.updateSubmit")
                    : t("detail.assignments.submit")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.assignments.historyTitle")}</h3>
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {roleMap.get(assignment.roleId)?.name ?? assignment.role.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {positionMap.get(assignment.positionId)?.name ?? assignment.position.name} · {locationMap.get(assignment.locationId)?.name ?? assignment.location.name}
                      </p>
                    </div>
                    <Badge tone="outline">
                      {formatDate(assignment.startDate)} - {assignment.endDate ? formatDate(assignment.endDate) : t("detail.labels.ongoing")}
                    </Badge>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => {
                        setEditingAssignmentId(assignment.id);
                        setAssignmentForm({
                          roleId: assignment.roleId,
                          positionId: assignment.positionId,
                          locationId: assignment.locationId,
                          startDate: assignment.startDate,
                          endDate: assignment.endDate ?? "",
                        });
                      }}
                    >
                      {t("detail.actions.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => void handleDeleteAssignment(assignment.id)}
                    >
                      {t("detail.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.assignments.empty")}</p>
            )}
          </div>
        </Card>
      ) : null}

      {activeSection === "assets" ? (
        <Card className="grid gap-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.assets.title")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("detail.assets.description")}</p>
            </div>
            <Badge tone="outline">{linkedAssets.length}</Badge>
          </div>

          {employeeAssetsQuery.isLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Spinner className="h-5 w-5" />
              <span>{t("detail.assets.loading")}</span>
            </div>
          ) : null}

          {!employeeAssetsQuery.isLoading && linkedAssets.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.assets.empty")}</p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {linkedAssets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/assets/$assetId", params: { assetId: asset.id } })}
                      className="font-semibold text-slate-900 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
                    >
                      {asset.name}
                    </button>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {asset.inventoryCode} · {asset.brand || t("table.na")} · {asset.model || t("table.na")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {asset.status ? <Badge tone="info">{asset.status.name}</Badge> : null}
                    {asset.category ? <Badge tone="outline">{asset.category.name}</Badge> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeSection === "payroll" && payrollEnabled ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.payroll.title")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("detail.payroll.description")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryStatCard label={t("detail.payroll.contractsCount")} value={payrollContracts.length} icon={<BriefcaseBusiness className="h-6 w-6" />} />
              <SummaryStatCard label={t("detail.payroll.payslipsCount")} value={payrollPaySlips.length} icon={<BadgeCheck className="h-6 w-6" />} />
            </div>

            <div className="grid gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.payroll.contractsTitle")}</h3>
              {payrollContractsQuery.isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.payroll.loadingContracts")}</p> : null}
              {!payrollContractsQuery.isLoading && payrollContracts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.payroll.emptyContracts")}</p>
              ) : null}
              {payrollContracts.map((contract) => (
                <div key={contract.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{contract.contractType}</p>
                    <Badge tone="outline">{contract.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : t("detail.labels.ongoing")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(contract.salaryAmount, contract.currency)} · {t(`paymentFrequencies.${contract.paymentFrequency}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.payroll.payslipsTitle")}</h3>
            {payrollPaySlipsQuery.isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.payroll.loadingPaySlips")}</p> : null}
            {!payrollPaySlipsQuery.isLoading && payrollPaySlips.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.payroll.emptyPaySlips")}</p>
            ) : null}
            {payrollPaySlips.map((paySlip) => (
              <div key={paySlip.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(paySlip.payPeriodStart)} - {formatDate(paySlip.payPeriodEnd)}
                  </p>
                  <Badge tone="outline">{t(`payrollStatuses.${paySlip.status}`)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t("detail.payroll.grossAmount")}: {formatCurrency(paySlip.grossAmount, paySlip.currency)}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {t("detail.payroll.netAmount")}: {formatCurrency(paySlip.netAmount, paySlip.currency)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeSection === "contracts" ? (
        <Card className="grid gap-6 p-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.contracts.title")}</h2>

            <Field label={t("detail.contracts.contractType")} value={contractForm.contractType} onChange={(event) => setContractForm((prev) => ({ ...prev, contractType: event.target.value }))} />
            <Field label={t("detail.contracts.startDate")} type="date" value={contractForm.startDate} onChange={(event) => setContractForm((prev) => ({ ...prev, startDate: event.target.value }))} />
            <Field label={t("detail.contracts.endDate")} type="date" value={contractForm.endDate} onChange={(event) => setContractForm((prev) => ({ ...prev, endDate: event.target.value }))} />
            <Field label={t("detail.contracts.salaryAmount")} type="number" value={contractForm.salaryAmount} onChange={(event) => setContractForm((prev) => ({ ...prev, salaryAmount: event.target.value }))} />
            <Field label={t("detail.contracts.currency")} value={contractForm.currency} onChange={(event) => setContractForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.contracts.status")}</span>
              <select
                value={contractForm.status}
                onChange={(event) => setContractForm((prev) => ({ ...prev, status: event.target.value }))}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                {contractStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`contractStatuses.${status}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("detail.contracts.paymentFrequency")}</span>
              <select
                value={contractForm.paymentFrequency}
                onChange={(event) => setContractForm((prev) => ({ ...prev, paymentFrequency: event.target.value }))}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                {paymentFrequencies.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {t(`paymentFrequencies.${frequency}`)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3">
              {editingContractId ? (
                <Button
                  variant="secondary"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => {
                    setEditingContractId(null);
                    setContractForm(buildDefaultContractForm());
                  }}
                >
                  {t("detail.actions.cancelEdit")}
                </Button>
              ) : null}
              <Button onClick={() => void handleSaveContract()} disabled={isSavingContract}>
                {isSavingContract
                  ? t("detail.contracts.saving")
                  : editingContractId
                    ? t("detail.contracts.updateSubmit")
                    : t("detail.contracts.submit")}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("detail.contracts.historyTitle")}</h3>
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <div key={contract.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{contract.contractType}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(contract.salaryAmount, contract.currency)} · {t(`paymentFrequencies.${contract.paymentFrequency}`)}
                      </p>
                    </div>
                    <Badge tone="outline">{t(`contractStatuses.${contract.status}`)}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(contract.startDate)} - {contract.endDate ? formatDate(contract.endDate) : t("detail.labels.ongoing")}
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => {
                        setEditingContractId(contract.id);
                        setContractForm({
                          contractType: contract.contractType,
                          status: contract.status,
                          startDate: contract.startDate,
                          endDate: contract.endDate ?? "",
                          salaryAmount: String(contract.salaryAmount),
                          currency: contract.currency,
                          paymentFrequency: contract.paymentFrequency,
                        });
                      }}
                    >
                      {t("detail.actions.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => void handleDeleteContract(contract.id)}
                    >
                      {t("detail.actions.delete")}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.contracts.empty")}</p>
            )}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
