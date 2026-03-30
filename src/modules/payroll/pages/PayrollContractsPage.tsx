import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BriefcaseBusiness, CalendarRange, FileSpreadsheet, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePayrollContracts } from "@/modules/payroll/hooks/usePayroll";
import { type PayrollContract } from "@/modules/payroll/types/payroll.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { Badge, Button, Card } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type ContractSortBy = "createdAt" | "updatedAt" | "startDate" | "endDate" | "salaryAmount";
type ContractSortOrder = "asc" | "desc";

function mapOrdering(ordering: string): { sortBy: ContractSortBy; sortOrder: ContractSortOrder } {
  const normalized = ordering.split(",")[0]?.trim();
  if (!normalized) return { sortBy: "startDate", sortOrder: "desc" };
  const sortOrder: ContractSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowed: ContractSortBy[] = ["createdAt", "updatedAt", "startDate", "endDate", "salaryAmount"];
  return { sortBy: allowed.includes(rawField as ContractSortBy) ? (rawField as ContractSortBy) : "startDate", sortOrder };
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number, currency = "BIF") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function PayrollContractsPage() {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState("");

  const { sortBy, sortOrder } = mapOrdering(ordering);
  const contractsQuery = usePayrollContracts({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    status: backendFilters.status || undefined,
    paymentFrequency: backendFilters.paymentFrequency || undefined,
    sortBy,
    sortOrder,
  });

  const rows = contractsQuery.data?.results ?? [];

  const columns: DataTableColumn<PayrollContract>[] = [
    {
      key: "employeeId",
      label: t("contracts.table.employee"),
      accessor: "employee.fullName",
      searchable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate({ to: "/employees/$employeeId", params: { employeeId: row.employee.id } })}
          className="font-medium text-slate-900 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
        >
          {row.employee.fullName}
        </button>
      ),
    },
    {
      key: "contractType",
      label: t("contracts.table.contractType"),
      searchable: true,
      render: (row) => <Badge tone="outline">{row.contractType}</Badge>,
    },
    {
      key: "status",
      label: t("contracts.table.status"),
      filterable: true,
      type: "select",
      options: [
        { value: "draft", label: t("contractStatuses.draft") },
        { value: "active", label: t("contractStatuses.active") },
        { value: "suspended", label: t("contractStatuses.suspended") },
        { value: "terminated", label: t("contractStatuses.terminated") },
        { value: "expired", label: t("contractStatuses.expired") },
      ],
      render: (row) => <Badge tone={row.status === "active" ? "success" : "outline"}>{t(`contractStatuses.${row.status}`, { defaultValue: row.status })}</Badge>,
    },
    {
      key: "paymentFrequency",
      label: t("contracts.table.paymentFrequency"),
      filterable: true,
      type: "select",
      options: [
        { value: "weekly", label: t("paymentFrequencies.weekly") },
        { value: "biweekly", label: t("paymentFrequencies.biweekly") },
        { value: "monthly", label: t("paymentFrequencies.monthly") },
        { value: "quarterly", label: t("paymentFrequencies.quarterly") },
        { value: "annual", label: t("paymentFrequencies.annual") },
      ],
      render: (row) => <Badge tone="info">{t(`paymentFrequencies.${row.paymentFrequency}`, { defaultValue: row.paymentFrequency })}</Badge>,
    },
    { key: "salaryAmount", label: t("contracts.table.salaryAmount"), sortable: true, render: (row) => formatCurrency(row.salaryAmount, row.currency) },
    { key: "startDate", label: t("contracts.table.startDate"), sortable: true, render: (row) => formatDate(row.startDate) },
    { key: "endDate", label: t("contracts.table.endDate"), sortable: true, render: (row) => formatDate(row.endDate) },
    { key: "updatedAt", label: t("contracts.table.updatedAt"), sortable: true, render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/payroll" })}>
          {t("contracts.back")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("contracts.title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("contracts.description")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("contracts.stats.total")} value={contractsQuery.data?.count ?? 0} icon={<FileSpreadsheet className="h-6 w-6" />} />
          <SummaryStatCard label={t("contracts.stats.active")} value={rows.filter((row) => row.status === "active").length} icon={<BriefcaseBusiness className="h-6 w-6" />} />
          <SummaryStatCard label={t("contracts.stats.monthly")} value={rows.filter((row) => row.paymentFrequency === "monthly").length} icon={<CalendarRange className="h-6 w-6" />} />
          <SummaryStatCard label={t("contracts.stats.employees")} value={new Set(rows.map((row) => row.employeeId)).size} icon={<Users className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<PayrollContract>
        tableId="payroll-contracts-table"
        data={contractsQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={contractsQuery.isLoading}
        error={contractsQuery.isError ? t("contracts.table.loadError") : null}
        isPaginated
        onBackendFiltersChange={(filters) => {
          setCurrentPage(1);
          setBackendFilters(filters);
        }}
        onBackendOrderingChange={(nextOrdering) => {
          setCurrentPage(1);
          setOrdering(nextOrdering);
        }}
      />
    </section>
  );
}
