import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CircleDollarSign, Landmark, Link2, Plus, ReceiptText, Settings2, WalletCards, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  createFinanceTransaction,
  deleteFinanceTransaction,
  updateFinanceTransaction,
} from "@/modules/finance/api/finance.api";
import {
  financeQueryKeys,
  useFinanceTransactions,
  usePaymentMethods,
  useTransactionTypes,
} from "@/modules/finance/hooks/useFinance";
import { type FinanceTransactionRecord } from "@/modules/finance/types/finance.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";
import { Badge, Button, Card, Field } from "@/shared/ui";

type FinanceSortBy = "transactionDate" | "amount" | "createdAt" | "updatedAt";
type FinanceSortOrder = "asc" | "desc";

type TransactionFormState = {
  transactionTypeId: string;
  accountingCategory: string;
  amount: string;
  paymentMethodId: string;
  referenceNumber: string;
  transactionDate: string;
  description: string;
};

function mapOrdering(ordering: string): { sortBy: FinanceSortBy; sortOrder: FinanceSortOrder } {
  const [firstOrdering] = ordering.split(",");
  const normalized = firstOrdering?.trim();

  if (!normalized) {
    return { sortBy: "transactionDate", sortOrder: "desc" };
  }

  const sortOrder: FinanceSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowedFields: FinanceSortBy[] = ["transactionDate", "amount", "createdAt", "updatedAt"];
  const sortBy = allowedFields.includes(rawField as FinanceSortBy)
    ? (rawField as FinanceSortBy)
    : "transactionDate";

  return { sortBy, sortOrder };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildInitialForm(
  transactionTypeId?: string,
  paymentMethodId?: string,
): TransactionFormState {
  return {
    transactionTypeId: transactionTypeId ?? "",
    accountingCategory: "",
    amount: "",
    paymentMethodId: paymentMethodId ?? "",
    referenceNumber: "",
    transactionDate: "",
    description: "",
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

export function FinancePage() {
  const { t } = useTranslation("finance");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createForm, setCreateForm] = useState<TransactionFormState>(buildInitialForm());

  const { sortBy, sortOrder } = mapOrdering(ordering);
  const paymentMethodsQuery = usePaymentMethods();
  const transactionTypesQuery = useTransactionTypes();
  const transactionsQuery = useFinanceTransactions({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    transactionTypeId: backendFilters.transactionTypeId || undefined,
    paymentMethodId: backendFilters.paymentMethodId || undefined,
    sortBy,
    sortOrder,
  });

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const transactionTypes = transactionTypesQuery.data ?? [];
  const rows = transactionsQuery.data?.results ?? [];

  const totalTransactions = transactionsQuery.data?.count ?? 0;
  const transactionVolume = rows.reduce((sum, row) => sum + row.amount, 0);
  const linkedEmployees = rows.filter((row) => row.employeeId).length;
  const payrollLinkedTransactions = rows.filter((row) => row.paySlipId).length;

  const refreshTransactions = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  };

  const resetCreateForm = () => {
    setCreateForm(buildInitialForm(transactionTypes[0]?.id, paymentMethods[0]?.id));
  };

  const handleCreateTransaction = async () => {
    const amount = Number.parseFloat(createForm.amount);

    if (
      !createForm.transactionTypeId ||
      !createForm.paymentMethodId ||
      !createForm.accountingCategory.trim() ||
      !createForm.transactionDate ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      notify.error(t("create.validationError"));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await createFinanceTransaction({
        transactionTypeId: createForm.transactionTypeId,
        accountingCategory: createForm.accountingCategory.trim(),
        amount,
        paymentMethodId: createForm.paymentMethodId,
        referenceNumber: createForm.referenceNumber.trim() || undefined,
        transactionDate: createForm.transactionDate,
        description: createForm.description.trim() || undefined,
      });

      notify.success(t("create.success"));
      setIsCreateOpen(false);
      resetCreateForm();
      await refreshTransactions();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("create.error")));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteTransaction = async (row: FinanceTransactionRecord) => {
    try {
      await deleteFinanceTransaction(row.id);
      notify.success(t("actions.deleteSuccess"));
      await refreshTransactions();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.deleteError")));
    }
  };

  const handleCellEdit = async (rowId: string | number, columnKey: string, newValue: string) => {
    const transactionId = String(rowId);

    try {
      switch (columnKey) {
        case "transactionTypeId":
          await updateFinanceTransaction(transactionId, { transactionTypeId: newValue });
          break;
        case "accountingCategory":
          await updateFinanceTransaction(transactionId, { accountingCategory: newValue.trim() });
          break;
        case "amount": {
          const amount = Number.parseFloat(newValue);
          if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Invalid amount");
          }
          await updateFinanceTransaction(transactionId, { amount });
          break;
        }
        case "paymentMethodId":
          await updateFinanceTransaction(transactionId, { paymentMethodId: newValue });
          break;
        case "referenceNumber":
          await updateFinanceTransaction(transactionId, { referenceNumber: newValue.trim() || undefined });
          break;
        case "transactionDate":
          await updateFinanceTransaction(transactionId, { transactionDate: newValue });
          break;
        case "description":
          await updateFinanceTransaction(transactionId, { description: newValue.trim() || undefined });
          break;
        default:
          return;
      }

      await refreshTransactions();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.updateError")));
      throw error;
    }
  };

  const columns: DataTableColumn<FinanceTransactionRecord>[] = [
    {
      key: "transactionDate",
      label: t("table.transactionDate"),
      sortable: true,
      editable: true,
      type: "date",
      render: (row) => formatDate(row.transactionDate),
    },
    {
      key: "transactionTypeId",
      label: t("table.transactionType"),
      accessor: "transactionType.name",
      filterable: true,
      editable: true,
      type: "select",
      options: transactionTypes.map((transactionType) => ({
        value: transactionType.id,
        label: transactionType.name,
      })),
      render: (row) =>
        row.transactionType ? <Badge tone="outline">{row.transactionType.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "accountingCategory",
      label: t("table.accountingCategory"),
      searchable: true,
      editable: true,
    },
    {
      key: "amount",
      label: t("table.amount"),
      sortable: true,
      editable: true,
      type: "number",
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "paymentMethodId",
      label: t("table.paymentMethod"),
      accessor: "paymentMethod.name",
      filterable: true,
      editable: true,
      type: "select",
      options: paymentMethods.map((method) => ({
        value: method.id,
        label: method.name,
      })),
      render: (row) =>
        row.paymentMethod ? <Badge tone="info">{row.paymentMethod.name}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "referenceNumber",
      label: t("table.referenceNumber"),
      searchable: true,
      editable: true,
      render: (row) => row.referenceNumber || <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "description",
      label: t("table.description"),
      searchable: true,
      editable: true,
      render: (row) => row.description || <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "paySlipId",
      label: t("table.payroll"),
      editable: false,
      render: (row) =>
        row.paySlipId ? <Badge tone="success">{t("table.payrollLinked")}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "updatedAt",
      label: t("table.updatedAt"),
      sortable: true,
      render: (row) => formatDate(row.updatedAt),
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
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" leftIcon={<WalletCards className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/journal-entries" })}>
              {t("journalEntries.open")}
            </Button>
            <Button variant="secondary" leftIcon={<Landmark className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/reconciliations" })}>
              {t("reconciliations.open")}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => navigate({ to: "/finance/references" })}
            >
              {t("references.open")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("stats.totalTransactions")} value={totalTransactions} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.transactionVolume")} value={formatCurrency(transactionVolume)} icon={<CircleDollarSign className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.linkedEmployees")} value={linkedEmployees} icon={<Link2 className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.payrollLinked")} value={payrollLinkedTransactions} icon={<Landmark className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<FinanceTransactionRecord>
        tableId="finance-transactions-table"
        data={transactionsQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={transactionsQuery.isLoading}
        error={transactionsQuery.isError ? t("table.loadError") : null}
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
        onDeleteRow={handleDeleteTransaction}
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
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.transactionType")}</span>
                <select
                  value={createForm.transactionTypeId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, transactionTypeId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("create.transactionTypePlaceholder")}</option>
                  {transactionTypes.map((transactionType) => (
                    <option key={transactionType.id} value={transactionType.id}>
                      {transactionType.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.paymentMethod")}</span>
                <select
                  value={createForm.paymentMethodId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, paymentMethodId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("create.paymentMethodPlaceholder")}</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label={t("create.accountingCategory")}
                value={createForm.accountingCategory}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, accountingCategory: event.target.value }))}
              />
              <Field
                label={t("create.amount")}
                type="number"
                value={createForm.amount}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
              <Field
                label={t("create.referenceNumber")}
                value={createForm.referenceNumber}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, referenceNumber: event.target.value }))}
              />
              <Field
                label={t("create.transactionDate")}
                type="date"
                value={createForm.transactionDate}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, transactionDate: event.target.value }))}
              />
            </div>

            <div className="mt-4">
              <Field
                label={t("create.descriptionField")}
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("create.cancel")}
              </Button>
              <Button onClick={() => void handleCreateTransaction()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingCreate}>
                {isSubmittingCreate ? t("create.submitting") : t("create.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
