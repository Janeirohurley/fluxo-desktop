import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Boxes, CircleDollarSign, Plus, ShieldAlert, Wrench, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createAsset, deleteAsset, updateAsset } from "@/modules/assets/api/assets.api";
import { assetsQueryKeys, useAssets, useAssetCategories, useAssetStatuses } from "@/modules/assets/hooks/useAssets";
import { type AssetRecord } from "@/modules/assets/types/assets.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";
import { Badge, Button, Card, Field } from "@/shared/ui";

type AssetSortBy = "createdAt" | "updatedAt" | "name" | "inventoryCode";
type AssetSortOrder = "asc" | "desc";

type AssetFormState = {
  inventoryCode: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  categoryId: string;
  statusId: string;
};

function mapOrdering(ordering: string): { sortBy: AssetSortBy; sortOrder: AssetSortOrder } {
  const [firstOrdering] = ordering.split(",");
  const normalized = firstOrdering?.trim();

  if (!normalized) {
    return { sortBy: "createdAt", sortOrder: "desc" };
  }

  const sortOrder: AssetSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowedFields: AssetSortBy[] = ["createdAt", "updatedAt", "name", "inventoryCode"];
  const sortBy = allowedFields.includes(rawField as AssetSortBy) ? (rawField as AssetSortBy) : "createdAt";

  return { sortBy, sortOrder };
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function buildInitialForm(categoryId?: string, statusId?: string): AssetFormState {
  return {
    inventoryCode: "",
    name: "",
    brand: "",
    model: "",
    serialNumber: "",
    categoryId: categoryId ?? "",
    statusId: statusId ?? "",
  };
}

export function AssetsPage() {
  const { t } = useTranslation("assets");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState<AssetFormState>(buildInitialForm());

  const { sortBy, sortOrder } = mapOrdering(ordering);
  const categoriesQuery = useAssetCategories();
  const statusesQuery = useAssetStatuses();
  const assetsQuery = useAssets({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    categoryId: backendFilters.categoryId || undefined,
    statusId: backendFilters.statusId || undefined,
    sortBy,
    sortOrder,
  });

  const categories = categoriesQuery.data ?? [];
  const statuses = statusesQuery.data ?? [];
  const rows = assetsQuery.data?.results ?? [];
  const totalAssets = assetsQuery.data?.count ?? 0;
  const assetsWithFinance = rows.filter((row) => row.financeData).length;
  const assignedAssets = rows.filter((row) => row.assignments.length > 0).length;
  const assetsWithMaintenance = rows.filter((row) => row.maintenanceLogs.length > 0).length;

  const resetCreateForm = () => {
    setCreateForm(buildInitialForm(categories[0]?.id, statuses[0]?.id));
  };

  const refreshAssets = async () => {
    await queryClient.invalidateQueries({ queryKey: ["assets"] });
    await queryClient.invalidateQueries({ queryKey: assetsQueryKeys.list({
      page: currentPage,
      pageSize: itemsPerPage,
      search,
      categoryId: backendFilters.categoryId || undefined,
      statusId: backendFilters.statusId || undefined,
      sortBy,
      sortOrder,
    }) });
  };

  const handleCreateAsset = async () => {
    if (!createForm.inventoryCode.trim() || !createForm.name.trim() || !createForm.categoryId || !createForm.statusId) {
      notify.error(t("create.validationError"));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await createAsset({
        inventoryCode: createForm.inventoryCode.trim(),
        name: createForm.name.trim(),
        brand: createForm.brand.trim() || undefined,
        model: createForm.model.trim() || undefined,
        serialNumber: createForm.serialNumber.trim() || undefined,
        categoryId: createForm.categoryId,
        statusId: createForm.statusId,
      });

      notify.success(t("create.success"));
      setIsCreateOpen(false);
      resetCreateForm();
      await refreshAssets();
    } catch (error) {
      console.error(error);
      notify.error(t("create.error"));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteAsset = async (row: AssetRecord) => {
    try {
      await deleteAsset(row.id);
      notify.success(t("actions.deleteSuccess"));
      await refreshAssets();
    } catch (error) {
      console.error(error);
      notify.error(t("actions.deleteError"));
    }
  };

  const handleCellEdit = async (rowId: string | number, columnKey: string, newValue: string) => {
    const assetId = String(rowId);

    try {
      switch (columnKey) {
        case "inventoryCode":
          await updateAsset(assetId, { inventoryCode: newValue.trim() });
          break;
        case "name":
          await updateAsset(assetId, { name: newValue.trim() });
          break;
        case "brand":
          await updateAsset(assetId, { brand: newValue.trim() || undefined });
          break;
        case "model":
          await updateAsset(assetId, { model: newValue.trim() || undefined });
          break;
        case "serialNumber":
          await updateAsset(assetId, { serialNumber: newValue.trim() || undefined });
          break;
        case "categoryId":
          await updateAsset(assetId, { categoryId: newValue });
          break;
        case "statusId":
          await updateAsset(assetId, { statusId: newValue });
          break;
        default:
          return;
      }

      await refreshAssets();
    } catch (error) {
      console.error(error);
      notify.error(t("actions.updateError"));
      throw error;
    }
  };

  const columns: DataTableColumn<AssetRecord>[] = [
    {
      key: "inventoryCode",
      label: t("table.inventoryCode"),
      sortable: true,
      searchable: true,
      editable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate({ to: "/assets/$assetId", params: { assetId: row.id } })}
          className="font-medium text-blue-700 underline-offset-4 transition hover:underline dark:text-blue-300"
        >
          {row.inventoryCode}
        </button>
      ),
    },
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      searchable: true,
      editable: true,
    },
    {
      key: "categoryId",
      label: t("table.category"),
      accessor: "category.name",
      filterable: true,
      editable: true,
      type: "select",
      options: categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
      render: (row) =>
        row.category ? <Badge tone="outline">{row.category.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "statusId",
      label: t("table.status"),
      accessor: "status.name",
      filterable: true,
      editable: true,
      type: "select",
      options: statuses.map((status) => ({
        value: status.id,
        label: status.name,
      })),
      render: (row) =>
        row.status ? <Badge tone="info">{row.status.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "brand",
      label: t("table.brand"),
      searchable: true,
      editable: true,
    },
    {
      key: "model",
      label: t("table.model"),
      searchable: true,
      editable: true,
    },
    {
      key: "serialNumber",
      label: t("table.serialNumber"),
      searchable: true,
      editable: true,
    },
    {
      key: "purchaseValue",
      label: t("table.purchaseValue"),
      editable: false,
      render: (row) => formatCurrency(row.financeData?.purchaseValue),
    },
    {
      key: "assignmentCount",
      label: t("table.assignmentCount"),
      editable: false,
      render: (row) => row.assignments.length,
    },
    {
      key: "maintenanceCount",
      label: t("table.maintenanceCount"),
      editable: false,
      render: (row) => row.maintenanceLogs.length,
    },
    {
      key: "updatedAt",
      label: t("table.updatedAt"),
      sortable: true,
      editable: false,
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: "updatedAt",
      label: "Mise a jour",
      sortable: true,
      editable: false,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  return (
    <section className="grid gap-6">
      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("stats.totalAssets")} value={totalAssets} icon={<Boxes className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.withFinance")} value={assetsWithFinance} icon={<CircleDollarSign className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.assigned")} value={assignedAssets} icon={<ShieldAlert className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.maintenance")} value={assetsWithMaintenance} icon={<Wrench className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<AssetRecord>
        tableId="assets-table"
        data={assetsQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={assetsQuery.isLoading}
        error={assetsQuery.isError ? t("table.loadError") : null}
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
          resetCreateForm();
          setIsCreateOpen(true);
        }}
        onDeleteRow={handleDeleteAsset}
        onCellEdit={handleCellEdit}
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("create.title")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("create.description")}
                </p>
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
              <Field
                label={t("create.inventoryCode")}
                value={createForm.inventoryCode}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, inventoryCode: event.target.value }))}
              />
              <Field
                label={t("create.name")}
                value={createForm.name}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <Field
                label={t("create.brand")}
                value={createForm.brand}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, brand: event.target.value }))}
              />
              <Field
                label={t("create.model")}
                value={createForm.model}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, model: event.target.value }))}
              />
              <Field
                label={t("create.serialNumber")}
                value={createForm.serialNumber}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, serialNumber: event.target.value }))}
              />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.category")}</span>
                <select
                  value={createForm.categoryId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("create.categoryPlaceholder")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.status")}</span>
                <select
                  value={createForm.statusId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, statusId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("create.statusPlaceholder")}</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("create.cancel")}
              </Button>
              <Button
                onClick={() => void handleCreateAsset()}
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={isSubmittingCreate}
              >
                {isSubmittingCreate ? t("create.submitting") : t("create.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
