import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, BookOpenText, Calculator, Plus, PlusCircle, ReceiptText, Send, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createJournalEntry, postJournalEntry } from "@/modules/finance/api/finance.api";
import {
  financeQueryKeys,
  useAccountingAccounts,
  useJournalEntries,
} from "@/modules/finance/hooks/useFinance";
import { type CreateJournalEntryLinePayload, type JournalEntryRecord } from "@/modules/finance/types/finance.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type JournalSortBy = "entryDate" | "createdAt" | "updatedAt" | "entryNumber";
type JournalSortOrder = "asc" | "desc";

type JournalLineFormState = {
  accountId: string;
  debitAmount: string;
  creditAmount: string;
  description: string;
  referenceNumber: string;
};

type JournalEntryFormState = {
  entryNumber: string;
  entryDate: string;
  description: string;
  periodYear: string;
  periodMonth: string;
  status: "draft" | "posted";
  lines: JournalLineFormState[];
};

function mapOrdering(ordering: string): { sortBy: JournalSortBy; sortOrder: JournalSortOrder } {
  const [firstOrdering] = ordering.split(",");
  const normalized = firstOrdering?.trim();

  if (!normalized) {
    return { sortBy: "entryDate", sortOrder: "desc" };
  }

  const sortOrder: JournalSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowedFields: JournalSortBy[] = ["entryDate", "createdAt", "updatedAt", "entryNumber"];
  const sortBy = allowedFields.includes(rawField as JournalSortBy)
    ? (rawField as JournalSortBy)
    : "entryDate";

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

function buildEmptyLine(accountId?: string): JournalLineFormState {
  return {
    accountId: accountId ?? "",
    debitAmount: "",
    creditAmount: "",
    description: "",
    referenceNumber: "",
  };
}

function buildInitialForm(defaultAccountId?: string): JournalEntryFormState {
  const now = new Date();
  return {
    entryNumber: "",
    entryDate: "",
    description: "",
    periodYear: String(now.getFullYear()),
    periodMonth: String(now.getMonth() + 1),
    status: "draft",
    lines: [buildEmptyLine(defaultAccountId), buildEmptyLine(defaultAccountId)],
  };
}

export function FinanceJournalEntriesPage() {
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

  const accountsQuery = useAccountingAccounts();
  const { sortBy, sortOrder } = mapOrdering(ordering);
  const journalEntriesQuery = useJournalEntries({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    status: (backendFilters.status as "draft" | "posted" | undefined) || undefined,
    sortBy,
    sortOrder,
  });

  const accounts = accountsQuery.data ?? [];
  const [createForm, setCreateForm] = useState<JournalEntryFormState>(buildInitialForm(accounts[0]?.id));
  const rows = journalEntriesQuery.data?.results ?? [];

  const totalEntries = journalEntriesQuery.data?.count ?? 0;
  const draftEntries = rows.filter((row) => row.status === "draft").length;
  const postedEntries = rows.filter((row) => row.status === "posted").length;
  const payrollLinkedLines = rows.reduce(
    (sum, row) => sum + row.lines.filter((line) => Boolean(line.paySlipId)).length,
    0,
  );

  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: `${account.code} - ${account.name}`,
  }));

  const refreshJournalEntries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  };

  const journalColumns: DataTableColumn<JournalEntryRecord>[] = [
    {
      key: "entryNumber",
      label: t("journalEntries.table.entryNumber"),
      sortable: true,
      searchable: true,
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.entryNumber}</span>,
    },
    {
      key: "entryDate",
      label: t("journalEntries.table.entryDate"),
      sortable: true,
      render: (row) => formatDate(row.entryDate),
    },
    {
      key: "status",
      label: t("journalEntries.table.status"),
      filterable: true,
      type: "select",
      options: [
        { value: "draft", label: t("journalEntries.statuses.draft") },
        { value: "posted", label: t("journalEntries.statuses.posted") },
      ],
      render: (row) => (
        <Badge tone={row.status === "posted" ? "success" : "outline"}>
          {t(`journalEntries.statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: "period",
      label: t("journalEntries.table.period"),
      render: (row) => `${row.periodMonth.toString().padStart(2, "0")}/${row.periodYear}`,
    },
    {
      key: "lines",
      label: t("journalEntries.table.lines"),
      render: (row) => row.lines.length,
    },
    {
      key: "payroll",
      label: t("journalEntries.table.payroll"),
      render: (row) => {
        const payrollLinesCount = row.lines.filter((line) => Boolean(line.paySlipId)).length;
        return payrollLinesCount > 0 ? <Badge tone="success">{t("journalEntries.table.payrollLinkedCount", { count: payrollLinesCount })}</Badge> : <span className="text-slate-400">{t("table.na")}</span>;
      },
    },
    {
      key: "updatedAt",
      label: t("journalEntries.table.updatedAt"),
      sortable: true,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  const totals = useMemo(() => {
    return createForm.lines.reduce(
      (acc, line) => {
        const debit = Number.parseFloat(line.debitAmount) || 0;
        const credit = Number.parseFloat(line.creditAmount) || 0;

        return {
          debit: acc.debit + debit,
          credit: acc.credit + credit,
        };
      },
      { debit: 0, credit: 0 },
    );
  }, [createForm.lines]);

  const handleCreateJournalEntry = async () => {
    const year = Number.parseInt(createForm.periodYear, 10);
    const month = Number.parseInt(createForm.periodMonth, 10);

    if (!createForm.entryNumber.trim() || !createForm.entryDate || !Number.isInteger(year) || !Number.isInteger(month)) {
      notify.error(t("journalEntries.create.validationError"));
      return;
    }

    const lines: CreateJournalEntryLinePayload[] = createForm.lines
      .map((line) => ({
        accountId: line.accountId,
        debitAmount: Number.parseFloat(line.debitAmount) || 0,
        creditAmount: Number.parseFloat(line.creditAmount) || 0,
        description: line.description.trim() || undefined,
        referenceNumber: line.referenceNumber.trim() || undefined,
      }))
      .filter((line) => line.accountId);

    const isInvalidLine = lines.some((line) => {
      const hasDebit = line.debitAmount > 0;
      const hasCredit = line.creditAmount > 0;
      return hasDebit === hasCredit;
    });

    if (lines.length < 2 || isInvalidLine || Number(totals.debit.toFixed(2)) !== Number(totals.credit.toFixed(2))) {
      notify.error(t("journalEntries.create.linesValidationError"));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await createJournalEntry({
        entryNumber: createForm.entryNumber.trim(),
        entryDate: createForm.entryDate,
        description: createForm.description.trim() || undefined,
        periodYear: year,
        periodMonth: month,
        status: createForm.status,
        lines,
      });

      notify.success(t("journalEntries.create.success"));
      setIsCreateOpen(false);
      setCreateForm(buildInitialForm(accounts[0]?.id));
      await refreshJournalEntries();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("journalEntries.create.error")));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handlePostEntry = async (entry: JournalEntryRecord) => {
    try {
      await postJournalEntry(entry.id);
      notify.success(t("journalEntries.actions.postSuccess"));
      await refreshJournalEntries();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("journalEntries.actions.postError")));
    }
  };

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/finance" })}>
          {t("journalEntries.back")}
        </Button>
        <Button variant="secondary" leftIcon={<ReceiptText className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/reconciliations" })}>
          {t("reconciliations.open")}
        </Button>
        <Button variant="secondary" leftIcon={<Calculator className="h-4 w-4" />} onClick={() => navigate({ to: "/finance/references" })}>
          {t("references.open")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("journalEntries.title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("journalEntries.description")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("journalEntries.stats.total")} value={totalEntries} icon={<BookOpenText className="h-6 w-6" />} />
          <SummaryStatCard label={t("journalEntries.stats.draft")} value={draftEntries} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("journalEntries.stats.posted")} value={postedEntries} icon={<BadgeCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("journalEntries.stats.payrollLines")} value={payrollLinkedLines} icon={<Calculator className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<JournalEntryRecord>
        tableId="finance-journal-entries-table"
        data={journalEntriesQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={journalColumns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={journalEntriesQuery.isLoading}
        error={journalEntriesQuery.isError ? t("journalEntries.table.loadError") : null}
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
          row.status === "draft" ? (
            <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} onClick={() => void handlePostEntry(row)}>
              {t("journalEntries.actions.post")}
            </Button>
          ) : null
        }
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("journalEntries.create.title")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("journalEntries.create.description")}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={t("journalEntries.create.entryNumber")} value={createForm.entryNumber} onChange={(event) => setCreateForm((prev) => ({ ...prev, entryNumber: event.target.value }))} />
              <Field label={t("journalEntries.create.entryDate")} type="date" value={createForm.entryDate} onChange={(event) => setCreateForm((prev) => ({ ...prev, entryDate: event.target.value }))} />
              <Field label={t("journalEntries.create.descriptionField")} value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} />
              <Field label={t("journalEntries.create.periodYear")} type="number" value={createForm.periodYear} onChange={(event) => setCreateForm((prev) => ({ ...prev, periodYear: event.target.value }))} />
              <Field label={t("journalEntries.create.periodMonth")} type="number" value={createForm.periodMonth} onChange={(event) => setCreateForm((prev) => ({ ...prev, periodMonth: event.target.value }))} />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntries.create.status")}</span>
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as "draft" | "posted" }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="draft">{t("journalEntries.statuses.draft")}</option>
                  <option value="posted">{t("journalEntries.statuses.posted")}</option>
                </select>
              </label>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("journalEntries.create.linesTitle")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("journalEntries.create.linesDescription")}</p>
                </div>

                <Button
                  variant="secondary"
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                  onClick={() => setCreateForm((prev) => ({ ...prev, lines: [...prev.lines, buildEmptyLine(accounts[0]?.id)] }))}
                >
                  {t("journalEntries.create.addLine")}
                </Button>
              </div>

              <div className="grid gap-4">
                {createForm.lines.map((line, index) => (
                  <Card key={`${index}-${line.accountId}`} className="grid gap-4 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t("journalEntries.create.lineTitle", { index: index + 1 })}
                      </h4>

                      {createForm.lines.length > 2 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCreateForm((prev) => ({
                              ...prev,
                              lines: prev.lines.filter((_, lineIndex) => lineIndex !== index),
                            }))
                          }
                          className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <label className="grid gap-2 xl:col-span-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntries.create.account")}</span>
                        <select
                          value={line.accountId}
                          onChange={(event) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              lines: prev.lines.map((current, lineIndex) =>
                                lineIndex === index ? { ...current, accountId: event.target.value } : current,
                              ),
                            }))
                          }
                          className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        >
                          <option value="">{t("journalEntries.create.accountPlaceholder")}</option>
                          {accountOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Field
                        label={t("journalEntries.create.debit")}
                        type="number"
                        value={line.debitAmount}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            lines: prev.lines.map((current, lineIndex) =>
                              lineIndex === index ? { ...current, debitAmount: event.target.value } : current,
                            ),
                          }))
                        }
                      />
                      <Field
                        label={t("journalEntries.create.credit")}
                        type="number"
                        value={line.creditAmount}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            lines: prev.lines.map((current, lineIndex) =>
                              lineIndex === index ? { ...current, creditAmount: event.target.value } : current,
                            ),
                          }))
                        }
                      />
                      <Field
                        label={t("journalEntries.create.referenceNumber")}
                        value={line.referenceNumber}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            lines: prev.lines.map((current, lineIndex) =>
                              lineIndex === index ? { ...current, referenceNumber: event.target.value } : current,
                            ),
                          }))
                        }
                      />
                    </div>

                    <Field
                      label={t("journalEntries.create.lineDescription")}
                      value={line.description}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          lines: prev.lines.map((current, lineIndex) =>
                            lineIndex === index ? { ...current, description: event.target.value } : current,
                          ),
                        }))
                      }
                    />
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryStatCard label={t("journalEntries.create.totalDebit")} value={formatCurrency(totals.debit)} icon={<Calculator className="h-6 w-6" />} />
                <SummaryStatCard label={t("journalEntries.create.totalCredit")} value={formatCurrency(totals.credit)} icon={<Calculator className="h-6 w-6" />} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("journalEntries.create.cancel")}
              </Button>
              <Button onClick={() => void handleCreateJournalEntry()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingCreate}>
                {isSubmittingCreate ? t("journalEntries.create.submitting") : t("journalEntries.create.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
