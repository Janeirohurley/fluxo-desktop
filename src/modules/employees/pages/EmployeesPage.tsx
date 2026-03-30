import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck, BriefcaseBusiness, FolderTree, Plus, UserRoundCog, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createEmployee, deleteEmployee, updateEmployee } from "@/modules/employees/api/employees.api";
import { employeesQueryKeys, useEmployees } from "@/modules/employees/hooks/useEmployees";
import {
  useEmployeeLocationsReference,
  useEmployeePositionsReference,
  useEmployeeRolesReference,
} from "@/modules/employees/hooks/useEmployeeReferences";
import { type EmployeeRecord } from "@/modules/employees/types/employees.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";
import { Badge, Button, Card, Field } from "@/shared/ui";

type EmployeeSortBy = "createdAt" | "updatedAt" | "employeeNumber" | "firstName" | "lastName" | "hireDate";
type EmployeeSortOrder = "asc" | "desc";

type EmployeeFormState = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  status: string;
};

const employeeStatuses = ["active", "inactive", "on_leave", "terminated"] as const;

function mapOrdering(ordering: string): { sortBy: EmployeeSortBy; sortOrder: EmployeeSortOrder } {
  const [firstOrdering] = ordering.split(",");
  const normalized = firstOrdering?.trim();

  if (!normalized) {
    return { sortBy: "createdAt", sortOrder: "desc" };
  }

  const sortOrder: EmployeeSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowedFields: EmployeeSortBy[] = ["createdAt", "updatedAt", "employeeNumber", "firstName", "lastName", "hireDate"];
  const sortBy = allowedFields.includes(rawField as EmployeeSortBy) ? (rawField as EmployeeSortBy) : "createdAt";

  return { sortBy, sortOrder };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function buildInitialForm(): EmployeeFormState {
  return {
    employeeNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hireDate: "",
    status: "active",
  };
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

export function EmployeesPage() {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(buildInitialForm());

  const { sortBy, sortOrder } = mapOrdering(ordering);
  const rolesQuery = useEmployeeRolesReference();
  const positionsQuery = useEmployeePositionsReference();
  const locationsQuery = useEmployeeLocationsReference();
  const employeesQuery = useEmployees({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    status: backendFilters.status || undefined,
    roleId: backendFilters.roleId || undefined,
    positionId: backendFilters.positionId || undefined,
    locationId: backendFilters.locationId || undefined,
    sortBy,
    sortOrder,
  });

  const roles = rolesQuery.data ?? [];
  const positions = positionsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const rows = employeesQuery.data?.results ?? [];

  const totalEmployees = employeesQuery.data?.count ?? 0;
  const activeEmployees = rows.filter((row) => row.status === "active").length;
  const employeesWithAssignment = rows.filter((row) => row.currentAssignment).length;
  const employeesWithContract = rows.filter((row) => row.activeContract).length;

  const filterOptions = useMemo(
    () => ({
      status: employeeStatuses.map((status) => ({
        value: status,
        label: t(`statuses.${status}`),
      })),
      roleId: roles.map((role) => ({ value: role.id, label: role.name })),
      positionId: positions.map((position) => ({ value: position.id, label: position.name })),
      locationId: locations.map((location) => ({ value: location.id, label: location.name })),
    }),
    [locations, positions, roles, t],
  );

  const refreshEmployees = async () => {
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
    await queryClient.invalidateQueries({
      queryKey: employeesQueryKeys.list({
        page: currentPage,
        pageSize: itemsPerPage,
        search,
        status: backendFilters.status || undefined,
        roleId: backendFilters.roleId || undefined,
        positionId: backendFilters.positionId || undefined,
        locationId: backendFilters.locationId || undefined,
        sortBy,
        sortOrder,
      }),
    });
  };

  const handleCreateEmployee = async () => {
    if (!createForm.employeeNumber.trim() || !createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.hireDate) {
      notify.error(t("create.validationError"));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await createEmployee({
        employeeNumber: createForm.employeeNumber.trim(),
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        hireDate: createForm.hireDate,
        status: createForm.status,
      });

      notify.success(t("create.success"));
      setIsCreateOpen(false);
      setCreateForm(buildInitialForm());
      await refreshEmployees();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("create.error")));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteEmployee = async (row: EmployeeRecord) => {
    try {
      await deleteEmployee(row.id);
      notify.success(t("actions.deleteSuccess"));
      await refreshEmployees();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.deleteError")));
    }
  };

  const handleCellEdit = async (rowId: string | number, columnKey: string, newValue: string) => {
    const employeeId = String(rowId);

    try {
      switch (columnKey) {
        case "employeeNumber":
          await updateEmployee(employeeId, { employeeNumber: newValue.trim() });
          break;
        case "firstName":
          await updateEmployee(employeeId, { firstName: newValue.trim() });
          break;
        case "lastName":
          await updateEmployee(employeeId, { lastName: newValue.trim() });
          break;
        case "email":
          await updateEmployee(employeeId, { email: newValue.trim() || undefined });
          break;
        case "phone":
          await updateEmployee(employeeId, { phone: newValue.trim() || undefined });
          break;
        case "hireDate":
          await updateEmployee(employeeId, { hireDate: newValue });
          break;
        case "status":
          await updateEmployee(employeeId, { status: newValue });
          break;
        default:
          return;
      }

      await refreshEmployees();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.updateError")));
      throw error;
    }
  };

  const columns: DataTableColumn<EmployeeRecord>[] = [
    {
      key: "employeeNumber",
      label: t("table.employeeNumber"),
      sortable: true,
      searchable: true,
      editable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate({ to: "/employees/$employeeId", params: { employeeId: row.id } })}
          className="font-medium text-blue-700 underline-offset-4 transition hover:underline dark:text-blue-300"
        >
          {row.employeeNumber}
        </button>
      ),
    },
    {
      key: "fullName",
      label: t("table.fullName"),
      searchable: true,
      editable: false,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate({ to: "/employees/$employeeId", params: { employeeId: row.id } })}
          className="text-left font-medium text-slate-900 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300"
        >
          {row.fullName}
        </button>
      ),
    },
    {
      key: "firstName",
      label: t("table.firstName"),
      sortable: true,
      searchable: true,
      editable: true,
    },
    {
      key: "lastName",
      label: t("table.lastName"),
      sortable: true,
      searchable: true,
      editable: true,
    },
    {
      key: "email",
      label: t("table.email"),
      searchable: true,
      editable: true,
    },
    {
      key: "phone",
      label: t("table.phone"),
      searchable: true,
      editable: true,
    },
    {
      key: "status",
      label: t("table.status"),
      sortable: false,
      filterable: true,
      editable: true,
      type: "select",
      options: filterOptions.status,
      render: (row) => <Badge tone={row.status === "active" ? "success" : "outline"}>{t(`statuses.${row.status}`)}</Badge>,
    },
    {
      key: "currentAssignment.roleId",
      label: t("table.role"),
      accessor: "currentAssignment.role.name",
      filterable: true,
      editable: false,
      render: (row) => row.currentAssignment ? <Badge tone="outline">{row.currentAssignment.role.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "currentAssignment.positionId",
      label: t("table.position"),
      accessor: "currentAssignment.position.name",
      filterable: true,
      editable: false,
      render: (row) => row.currentAssignment ? <Badge tone="outline">{row.currentAssignment.position.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "currentAssignment.locationId",
      label: t("table.location"),
      accessor: "currentAssignment.location.name",
      filterable: true,
      editable: false,
      render: (row) => row.currentAssignment ? <Badge tone="info">{row.currentAssignment.location.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "hireDate",
      label: t("table.hireDate"),
      sortable: true,
      editable: true,
      type: "date",
      render: (row) => formatDate(row.hireDate),
    },
    {
      key: "activeContract",
      label: t("table.contract"),
      editable: false,
      render: (row) => row.activeContract ? `${row.activeContract.contractType} · ${row.activeContract.currency} ${row.activeContract.salaryAmount}` : t("table.na"),
    },
  ];

  return (
    <section className="grid gap-6">
      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("description")}</p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="secondary"
            leftIcon={<FolderTree className="h-4 w-4" />}
            onClick={() => navigate({ to: "/employees/references" })}
          >
            {t("references.open")}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("stats.totalEmployees")} value={totalEmployees} icon={<Users className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.activeEmployees")} value={activeEmployees} icon={<BadgeCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.withAssignment")} value={employeesWithAssignment} icon={<UserRoundCog className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.withContract")} value={employeesWithContract} icon={<BriefcaseBusiness className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<EmployeeRecord>
        tableId="employees-table"
        data={employeesQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={employeesQuery.isLoading}
        error={employeesQuery.isError ? t("table.loadError") : null}
        isPaginated
        onBackendFiltersChange={(filters) => {
          setCurrentPage(1);
          setBackendFilters(filters);
        }}
        onBackendOrderingChange={(nextOrdering) => {
          setCurrentPage(1);
          setOrdering(nextOrdering);
        }}
        onAddRow={() => {
          setCreateForm(buildInitialForm());
          setIsCreateOpen(true);
        }}
        onDeleteRow={handleDeleteEmployee}
        onCellEdit={handleCellEdit}
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("create.title")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("create.description")}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label={t("create.employeeNumber")} value={createForm.employeeNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, employeeNumber: event.target.value }))} />
              <Field label={t("create.firstName")} value={createForm.firstName} onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              <Field label={t("create.lastName")} value={createForm.lastName} onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))} />
              <Field label={t("create.email")} type="email" value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} />
              <Field label={t("create.phone")} value={createForm.phone} onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <Field label={t("create.hireDate")} type="date" value={createForm.hireDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, hireDate: event.target.value }))} />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.status")}</span>
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  {employeeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("create.cancel")}
              </Button>
              <Button onClick={() => void handleCreateEmployee()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingCreate}>
                {isSubmittingCreate ? t("create.submitting") : t("create.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
