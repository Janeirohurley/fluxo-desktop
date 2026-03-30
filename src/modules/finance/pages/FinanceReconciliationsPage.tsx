import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, BookCheck, Link2, Plus, ReceiptText, ShieldCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  addReconciliationItem,
  closeReconciliation,
  createReconciliation,
} from "@/modules/finance/api/finance.api";
import {
  financeQueryKeys,
  useAccountingAccounts,
  useFinanceTransactions,
  useJournalEntries,
  useReconciliations,
} from "@/modules/finance/hooks/useFinance";
import { type ReconciliationRecord } from "@/modules/finance/types/finance.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type ReconciliationSortBy = "statementEndDate" | "statementStartDate" | "createdAt" | "updatedAt";
type ReconciliationSortOrder = "asc" | "desc";

type ReconciliationFormState = {
  reconciliationType: string;
  accountId: string;
  statementStartDate: string;
  statementEndDate: string;
  statementBalance: string;
  bookBalance: string;
};

type ReconciliationItemSource = "transaction" | "journalEntryLine";

function mapOrdering(ordering: string): { sortBy: ReconciliationSortBy; sortOrder: ReconciliationSortOrder } {
  const [firstOrdering] = ordering.split(",");
  const normalized = firstOrdering?.trim();

  if (!normalized) {
    return { sortBy: "statementEndDate", sortOrder: "desc" };
  }

  const sortOrder: ReconciliationSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowedFields: ReconciliationSortBy[] = ["statementEndDate", "statementStartDate", "createdAt", "updatedAt"];
  const sortBy = allowedFields.includes(rawField as ReconciliationSortBy)
    ? (rawField as ReconciliationSortBy)
    : "statementEndDate";

  return { sortBy, sortOrder };
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
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

function buildInitialForm(accountId?: string): ReconciliationFormState {
  return {
    reconciliationType: "",
    accountId: accountId ?? "",
    statementStartDate: "",
    statementEndDate: "",
    statementBalance: "",
    bookBalance: "",
  };
}

export function FinanceReconciliationsPage() {
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
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string>("");
  const [selectedItemSource, setSelectedItemSource] = useState<ReconciliationItemSource>("transaction");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [selectedJournalEntryLineId, setSelectedJournalEntryLineId] = useState<string>("");
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const accountsQuery = useAccountingAccounts();
  const { sortBy, sortOrder } = mapOrdering(ordering);
  const reconciliationsQuery = useReconciliations({
    page: currentPage,
    pageSize: itemsPerPage,
    status: (backendFilters.status as "open" | "closed" | undefined) || undefined,
    accountId: backendFilters.accountId || undefined,
    reconciliationType: search || undefined,
    sortBy,
    sortOrder,
  });
  const transactionOptionsQuery = useFinanceTransactions({
    page: 1,
    pageSize: 100,
    sortBy: "transactionDate",
    sortOrder: "desc",
  });
  const journalEntryOptionsQuery = useJournalEntries({
    page: 1,
    pageSize: 100,
    status: "posted",
    sortBy: "entryDate",
    sortOrder: "desc",
  });

  const accounts = accountsQuery.data ?? [];
  const rows = reconciliationsQuery.data?.results ?? [];
  const transactionOptions = transactionOptionsQuery.data?.results ?? [];
  const journalEntryOptions = journalEntryOptionsQuery.data?.results ?? [];
  const [createForm, setCreateForm] = useState<ReconciliationFormState>(buildInitialForm(accounts[0]?.id));

  const totalReconciliations = reconciliationsQuery.data?.count ?? 0;
  const openReconciliations = rows.filter((row) => row.status === "open").length;
  const closedReconciliations = rows.filter((row) => row.status === "closed").length;
  const matchedItemsCount = rows.reduce((sum, row) => sum + row.items.length, 0);

  const filteredTransactionOptions = useMemo(
    () => transactionOptions.filter((transaction) => !transaction.journalEntryId),
    [transactionOptions],
  );
  const journalEntryLineOptions = useMemo(
    () =>
      journalEntryOptions.flatMap((entry) =>
        entry.lines.map((line) => ({
          id: line.id,
          entryNumber: entry.entryNumber,
          entryDate: entry.entryDate,
          accountId: line.accountId,
          description: line.description,
          referenceNumber: line.referenceNumber,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          paySlipId: line.paySlipId,
        })),
      ),
    [journalEntryOptions],
  );

  const refreshReconciliations = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  };

  const reconciliationColumns: DataTableColumn<ReconciliationRecord>[] = [
    {
      key: "reconciliationType",
      label: t("reconciliations.table.reconciliationType"),
      searchable: true,
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.reconciliationType}</span>,
    },
    {
      key: "accountId",
      label: t("reconciliations.table.account"),
      accessor: "account.name",
      filterable: true,
      type: "select",
      options: accounts.map((account) => ({
        value: account.id,
        label: `${account.code} - ${account.name}`,
      })),
      render: (row) => row.account ? <Badge tone="outline">{`${row.account.code} - ${row.account.name}`}</Badge> : <span className="text-slate-400">{t("table.na")}</span>,
    },
    {
      key: "statementStartDate",
      label: t("reconciliations.table.statementStartDate"),
      sortable: true,
      render: (row) => formatDate(row.statementStartDate),
    },
    {
      key: "statementEndDate",
      label: t("reconciliations.table.statementEndDate"),
      sortable: true,
      render: (row) => formatDate(row.statementEndDate),
    },
    {
      key: "statementBalance",
      label: t("reconciliations.table.statementBalance"),
      render: (row) => formatCurrency(row.statementBalance),
    },
    {
      key: "bookBalance",
      label: t("reconciliations.table.bookBalance"),
      render: (row) => formatCurrency(row.bookBalance),
    },
    {
      key: "gap",
      label: t("reconciliations.table.gap"),
      render: (row) => formatCurrency(row.statementBalance - row.bookBalance),
    },
    {
      key: "status",
      label: t("reconciliations.table.status"),
      filterable: true,
      type: "select",
      options: [
        { value: "open", label: t("reconciliations.statuses.open") },
        { value: "closed", label: t("reconciliations.statuses.closed") },
      ],
      render: (row) => (
        <Badge tone={row.status === "closed" ? "success" : "outline"}>
          {t(`reconciliations.statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: "items",
      label: t("reconciliations.table.items"),
      render: (row) => row.items.length,
    },
    {
      key: "updatedAt",
      label: t("reconciliations.table.updatedAt"),
      sortable: true,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  const handleCreateReconciliation = async () => {
    const statementBalance = Number.parseFloat(createForm.statementBalance);
    const bookBalance = Number.parseFloat(createForm.bookBalance);

    if (
      !createForm.reconciliationType.trim() ||
      !createForm.accountId ||
      !createForm.statementStartDate ||
      !createForm.statementEndDate ||
      !Number.isFinite(statementBalance) ||
      !Number.isFinite(bookBalance)
    ) {
      notify.error(t("reconciliations.create.validationError"));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await createReconciliation({
        reconciliationType: createForm.reconciliationType.trim(),
        accountId: createForm.accountId,
        statementStartDate: createForm.statementStartDate,
        statementEndDate: createForm.statementEndDate,
        statementBalance,
        bookBalance,
      });

      notify.success(t("reconciliations.create.success"));
      setCreateForm(buildInitialForm(accounts[0]?.id));
      setIsCreateOpen(false);
      await refreshReconciliations();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("reconciliations.create.error")));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleCloseReconciliation = async (row: ReconciliationRecord) => {
    try {
      await closeReconciliation(row.id);
      notify.success(t("reconciliations.actions.closeSuccess"));
      await refreshReconciliations();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("reconciliations.actions.closeError")));
    }
  };

  const handleAddItem = async () => {
    if (!selectedReconciliationId) {
      notify.error(t("reconciliations.item.validationError"));
      return;
    }

    if (selectedItemSource === "transaction" && !selectedTransactionId) {
      notify.error(t("reconciliations.item.validationError"));
      return;
    }

    if (selectedItemSource === "journalEntryLine" && !selectedJournalEntryLineId) {
      notify.error(t("reconciliations.item.validationError"));
      return;
    }

    setIsSubmittingItem(true);

    try {
      await addReconciliationItem(
        selectedReconciliationId,
        selectedItemSource === "transaction"
          ? { transactionId: selectedTransactionId }
          : { journalEntryLineId: selectedJournalEntryLineId },
      );
      notify.success(t("reconciliations.item.success"));
      setSelectedItemSource("transaction");
      setSelectedTransactionId("");
      setSelectedJournalEntryLineId("");
      setSelectedReconciliationId("");
      setIsItemModalOpen(false);
      await refreshReconciliations();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("reconciliations.item.error")));
    } finally {
      setIsSubmittingItem(false);
    }
  };

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/finance" })}>
          {t("reconciliations.back")}
        </Button>
        <Button variant="secondary" leftIcon={<BookCheck className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/journal-entries" })}>
          {t("journalEntries.open")}
        </Button>
        <Button variant="secondary" leftIcon={<ReceiptText className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/references" })}>
          {t("references.open")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("reconciliations.title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("reconciliations.description")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("reconciliations.stats.total")} value={totalReconciliations} icon={<BookCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("reconciliations.stats.open")} value={openReconciliations} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("reconciliations.stats.closed")} value={closedReconciliations} icon={<BadgeCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("reconciliations.stats.items")} value={matchedItemsCount} icon={<Link2 className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<ReconciliationRecord>
        tableId="finance-reconciliations-table"
        data={reconciliationsQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={reconciliationColumns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={reconciliationsQuery.isLoading}
        error={reconciliationsQuery.isError ? t("reconciliations.table.loadError") : null}
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
          setCreateForm(buildInitialForm(accounts[0]?.id));
          setIsCreateOpen(true);
        }}
        renderActions={(row) =>
          row.status === "open" ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                leftIcon={<Link2 className="h-4 w-4" />}
                onClick={() => {
                  setSelectedReconciliationId(row.id);
                  setSelectedItemSource("transaction");
                  setSelectedTransactionId("");
                  setSelectedJournalEntryLineId("");
                  setIsItemModalOpen(true);
                }}
              >
                {t("reconciliations.actions.addItem")}
              </Button>
              <Button variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => void handleCloseReconciliation(row)}>
                {t("reconciliations.actions.close")}
              </Button>
            </div>
          ) : null
        }
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("reconciliations.create.title")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("reconciliations.create.description")}</p>
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
              <Field label={t("reconciliations.create.reconciliationType")} value={createForm.reconciliationType} onChange={(event) => setCreateForm((prev) => ({ ...prev, reconciliationType: event.target.value }))} />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("reconciliations.create.account")}</span>
                <select
                  value={createForm.accountId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, accountId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="">{t("reconciliations.create.accountPlaceholder")}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <Field label={t("reconciliations.create.statementStartDate")} type="date" value={createForm.statementStartDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, statementStartDate: event.target.value }))} />
              <Field label={t("reconciliations.create.statementEndDate")} type="date" value={createForm.statementEndDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, statementEndDate: event.target.value }))} />
              <Field label={t("reconciliations.create.statementBalance")} type="number" value={createForm.statementBalance} onChange={(event) => setCreateForm((prev) => ({ ...prev, statementBalance: event.target.value }))} />
              <Field label={t("reconciliations.create.bookBalance")} type="number" value={createForm.bookBalance} onChange={(event) => setCreateForm((prev) => ({ ...prev, bookBalance: event.target.value }))} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("reconciliations.create.cancel")}
              </Button>
              <Button onClick={() => void handleCreateReconciliation()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingCreate}>
                {isSubmittingCreate ? t("reconciliations.create.submitting") : t("reconciliations.create.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isItemModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("reconciliations.item.title")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("reconciliations.item.description")}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("reconciliations.item.sourceType")}</span>
                <select
                  value={selectedItemSource}
                  onChange={(event) => {
                    const nextSource = event.target.value as ReconciliationItemSource;
                    setSelectedItemSource(nextSource);
                    setSelectedTransactionId("");
                    setSelectedJournalEntryLineId("");
                  }}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="transaction">{t("reconciliations.item.sourceOptions.transaction")}</option>
                  <option value="journalEntryLine">{t("reconciliations.item.sourceOptions.journalEntryLine")}</option>
                </select>
              </label>

              {selectedItemSource === "transaction" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("reconciliations.item.transaction")}</span>
                  <select
                    value={selectedTransactionId}
                    onChange={(event) => setSelectedTransactionId(event.target.value)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="">{t("reconciliations.item.transactionPlaceholder")}</option>
                    {filteredTransactionOptions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>
                        {transaction.transactionDate} - {transaction.accountingCategory} - {formatCurrency(transaction.amount)}
                        {transaction.paySlipId ? ` - ${t("reconciliations.item.payrollMarker")}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("reconciliations.item.journalEntryLine")}</span>
                  <select
                    value={selectedJournalEntryLineId}
                    onChange={(event) => setSelectedJournalEntryLineId(event.target.value)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                  >
                    <option value="">{t("reconciliations.item.journalEntryLinePlaceholder")}</option>
                    {journalEntryLineOptions.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.entryNumber} - {line.entryDate} - {line.description ?? line.referenceNumber ?? line.accountId} -{" "}
                        {line.debitAmount > 0
                          ? `${t("reconciliations.item.debit")} ${formatCurrency(line.debitAmount)}`
                          : `${t("reconciliations.item.credit")} ${formatCurrency(line.creditAmount)}`}
                        {line.paySlipId ? ` - ${t("reconciliations.item.payrollMarker")}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsItemModalOpen(false)}>
                {t("reconciliations.item.cancel")}
              </Button>
              <Button onClick={() => void handleAddItem()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingItem}>
                {isSubmittingItem ? t("reconciliations.item.submitting") : t("reconciliations.item.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
