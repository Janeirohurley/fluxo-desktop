import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Calculator, Coins, FileSpreadsheet, Landmark, Pencil, Plus, PlusCircle, ReceiptText, Send, Trash2, Wallet, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";
import { financeQueryKeys, useAccountingAccounts, usePaymentMethods, useTransactionTypes } from "@/modules/finance/hooks/useFinance";
import {
  createPayrollJournalEntry,
  createPayrollPaySlip,
  generatePayrollPayRun,
  issuePayrollPaySlip,
  markPayrollPaySlipPaid,
  registerPayrollPayment,
  removePayrollPaySlip,
  updatePayrollPaySlip,
} from "@/modules/payroll/api/payroll.api";
import { payrollQueryKeys, usePayrollContracts, usePayrollOverview, usePayrollPaySlips } from "@/modules/payroll/hooks/usePayroll";
import { type PayrollPaySlip } from "@/modules/payroll/types/payroll.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type PaySlipSortBy = "createdAt" | "updatedAt" | "payPeriodStart" | "payPeriodEnd" | "grossAmount" | "netAmount";
type PaySlipSortOrder = "asc" | "desc";

type GenerateFormState = {
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;
  earningLabel: string;
  notes: string;
  skipExisting: boolean;
};

type JournalEntryFormState = {
  expenseAccountId: string;
  payrollPayableAccountId: string;
  deductionsPayableAccountId: string;
  entryDate: string;
  entryNumber: string;
  description: string;
  status: "draft" | "posted";
};

type PaymentFormState = {
  transactionTypeId: string;
  paymentMethodId: string;
  transactionDate: string;
  referenceNumber: string;
  description: string;
  markAsPaid: boolean;
};

type PaySlipLineType = "earning" | "deduction" | "tax" | "benefit";

type PaySlipLineFormState = {
  lineType: PaySlipLineType;
  label: string;
  amount: string;
  description: string;
};

type PaySlipFormState = {
  contractId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;
  currency: string;
  notes: string;
  lines: PaySlipLineFormState[];
};

function mapOrdering(ordering: string): { sortBy: PaySlipSortBy; sortOrder: PaySlipSortOrder } {
  const normalized = ordering.split(",")[0]?.trim();
  if (!normalized) return { sortBy: "payPeriodStart", sortOrder: "desc" };
  const sortOrder: PaySlipSortOrder = normalized.startsWith("-") ? "desc" : "asc";
  const rawField = normalized.replace(/^-/, "");
  const allowed: PaySlipSortBy[] = ["createdAt", "updatedAt", "payPeriodStart", "payPeriodEnd", "grossAmount", "netAmount"];
  return { sortBy: allowed.includes(rawField as PaySlipSortBy) ? (rawField as PaySlipSortBy) : "payPeriodStart", sortOrder };
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number, currency = "BIF") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
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

function buildEmptyPaySlipLine(defaultLabel: string): PaySlipLineFormState {
  return {
    lineType: "earning",
    label: defaultLabel,
    amount: "",
    description: "",
  };
}

function buildInitialPaySlipForm(defaultLabel: string): PaySlipFormState {
  return {
    contractId: "",
    payPeriodStart: "",
    payPeriodEnd: "",
    paymentDate: "",
    currency: "BIF",
    notes: "",
    lines: [buildEmptyPaySlipLine(defaultLabel)],
  };
}

export function PayrollPage() {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useAccessSession();
  const financeEnabled = session?.modules.includes("finance") ?? false;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({});
  const [ordering, setOrdering] = useState("");
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isJournalEntryModalOpen, setIsJournalEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaySlipId, setEditingPaySlipId] = useState<string | null>(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState<PayrollPaySlip | null>(null);
  const [isSubmittingPaySlip, setIsSubmittingPaySlip] = useState(false);
  const [isSubmittingGenerate, setIsSubmittingGenerate] = useState(false);
  const [isSubmittingJournalEntry, setIsSubmittingJournalEntry] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const defaultSalaryLabel = t("defaults.baseSalaryLabel");
  const [paySlipForm, setPaySlipForm] = useState<PaySlipFormState>(buildInitialPaySlipForm(defaultSalaryLabel));
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    payPeriodStart: "",
    payPeriodEnd: "",
    paymentDate: "",
    earningLabel: defaultSalaryLabel,
    notes: "",
    skipExisting: true,
  });
  const [journalEntryForm, setJournalEntryForm] = useState<JournalEntryFormState>({
    expenseAccountId: "",
    payrollPayableAccountId: "",
    deductionsPayableAccountId: "",
    entryDate: "",
    entryNumber: "",
    description: "",
    status: "draft",
  });
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    transactionTypeId: "",
    paymentMethodId: "",
    transactionDate: "",
    referenceNumber: "",
    description: "",
    markAsPaid: true,
  });

  const { sortBy, sortOrder } = mapOrdering(ordering);
  const overviewQuery = usePayrollOverview();
  const contractsQuery = usePayrollContracts({
    page: 1,
    pageSize: 100,
    status: "active",
    sortBy: "startDate",
    sortOrder: "desc",
  });
  const paySlipsQuery = usePayrollPaySlips({
    page: currentPage,
    pageSize: itemsPerPage,
    search,
    status: (backendFilters.status as "draft" | "issued" | "paid" | "cancelled" | undefined) ?? undefined,
    sortBy,
    sortOrder,
  });
  const accountsQuery = useAccountingAccounts(financeEnabled);
  const paymentMethodsQuery = usePaymentMethods(financeEnabled);
  const transactionTypesQuery = useTransactionTypes(financeEnabled);

  const overview = overviewQuery.data;
  const contracts = contractsQuery.data?.results ?? [];
  const accounts = accountsQuery.data ?? [];
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const transactionTypes = transactionTypesQuery.data ?? [];

  const refreshPayroll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
    ]);
  };

  const resetPaySlipForm = () => {
    setEditingPaySlipId(null);
    setPaySlipForm(buildInitialPaySlipForm(defaultSalaryLabel));
  };

  const hydratePaySlipForm = (paySlip: PayrollPaySlip) => {
    setEditingPaySlipId(paySlip.id);
    setPaySlipForm({
      contractId: paySlip.contractId,
      payPeriodStart: paySlip.payPeriodStart,
      payPeriodEnd: paySlip.payPeriodEnd,
      paymentDate: paySlip.paymentDate ?? "",
      currency: paySlip.currency,
      notes: paySlip.notes ?? "",
      lines: paySlip.lines.map((line) => ({
        lineType: line.lineType as PaySlipLineType,
        label: line.label,
        amount: String(line.amount),
        description: line.description ?? "",
      })),
    });
  };

  const handleSelectContract = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId);
    setPaySlipForm((prev) => ({
      ...prev,
      contractId,
      currency: contract?.currency ?? prev.currency,
      lines:
        prev.lines.length === 1 && !prev.lines[0]?.amount
          ? [{ ...prev.lines[0], amount: contract ? String(contract.salaryAmount) : "", label: defaultSalaryLabel }]
          : prev.lines,
    }));
  };

  const handleSavePaySlip = async () => {
    const selectedContract = contracts.find((contract) => contract.id === paySlipForm.contractId);
    const lines = paySlipForm.lines
      .map((line) => ({
        lineType: line.lineType,
        label: line.label.trim(),
        amount: Number.parseFloat(line.amount),
        description: line.description.trim() || undefined,
      }))
      .filter((line) => line.label && Number.isFinite(line.amount) && line.amount > 0);

    if (!selectedContract || !paySlipForm.payPeriodStart || !paySlipForm.payPeriodEnd || lines.length === 0) {
      notify.error(t("create.validationError"));
      return;
    }

    setIsSubmittingPaySlip(true);

    try {
      if (editingPaySlipId) {
        await updatePayrollPaySlip(editingPaySlipId, {
          payPeriodStart: paySlipForm.payPeriodStart,
          payPeriodEnd: paySlipForm.payPeriodEnd,
          paymentDate: paySlipForm.paymentDate || undefined,
          currency: paySlipForm.currency,
          notes: paySlipForm.notes.trim() || undefined,
          lines,
        });
        notify.success(t("create.updateSuccess"));
      } else {
        await createPayrollPaySlip({
          employeeId: selectedContract.employeeId,
          contractId: selectedContract.id,
          payPeriodStart: paySlipForm.payPeriodStart,
          payPeriodEnd: paySlipForm.payPeriodEnd,
          paymentDate: paySlipForm.paymentDate || undefined,
          currency: paySlipForm.currency,
          notes: paySlipForm.notes.trim() || undefined,
          lines,
        });
        notify.success(t("create.success"));
      }

      setIsPaySlipModalOpen(false);
      resetPaySlipForm();
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, editingPaySlipId ? t("create.updateError") : t("create.error")));
    } finally {
      setIsSubmittingPaySlip(false);
    }
  };

  const handleGeneratePayRun = async () => {
    if (!generateForm.payPeriodStart || !generateForm.payPeriodEnd) {
      notify.error(t("generate.validationError"));
      return;
    }
    setIsSubmittingGenerate(true);
    try {
      const result = await generatePayrollPayRun({
        payPeriodStart: generateForm.payPeriodStart,
        payPeriodEnd: generateForm.payPeriodEnd,
        paymentDate: generateForm.paymentDate || undefined,
        earningLabel: generateForm.earningLabel.trim() || t("defaults.baseSalaryLabel"),
        notes: generateForm.notes.trim() || undefined,
        skipExisting: generateForm.skipExisting,
      });
      notify.success(t("generate.success", { created: result.createdCount, skipped: result.skippedCount }));
      setIsGenerateModalOpen(false);
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("generate.error")));
    } finally {
      setIsSubmittingGenerate(false);
    }
  };

  const handleIssue = async (row: PayrollPaySlip) => {
    try {
      await issuePayrollPaySlip(row.id);
      notify.success(t("actions.issueSuccess"));
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.issueError")));
    }
  };

  const handleMarkPaid = async (row: PayrollPaySlip) => {
    try {
      await markPayrollPaySlipPaid(row.id, {});
      notify.success(t("actions.markPaidSuccess"));
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.markPaidError")));
    }
  };

  const handleDelete = async (row: PayrollPaySlip) => {
    try {
      await removePayrollPaySlip(row.id);
      notify.success(t("actions.deleteSuccess"));
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.deleteError")));
    }
  };

  const handleCreateJournalEntry = async () => {
    if (!selectedPaySlip || !journalEntryForm.expenseAccountId || !journalEntryForm.payrollPayableAccountId) {
      notify.error(t("journalEntry.validationError"));
      return;
    }
    setIsSubmittingJournalEntry(true);
    try {
      await createPayrollJournalEntry(selectedPaySlip.id, {
        expenseAccountId: journalEntryForm.expenseAccountId,
        payrollPayableAccountId: journalEntryForm.payrollPayableAccountId,
        deductionsPayableAccountId: journalEntryForm.deductionsPayableAccountId || undefined,
        entryDate: journalEntryForm.entryDate || undefined,
        entryNumber: journalEntryForm.entryNumber.trim() || undefined,
        description: journalEntryForm.description.trim() || undefined,
        status: journalEntryForm.status,
      });
      notify.success(t("journalEntry.success"));
      setIsJournalEntryModalOpen(false);
      setSelectedPaySlip(null);
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("journalEntry.error")));
    } finally {
      setIsSubmittingJournalEntry(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedPaySlip || !paymentForm.transactionTypeId || !paymentForm.paymentMethodId) {
      notify.error(t("payment.validationError"));
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await registerPayrollPayment(selectedPaySlip.id, {
        transactionTypeId: paymentForm.transactionTypeId,
        paymentMethodId: paymentForm.paymentMethodId,
        transactionDate: paymentForm.transactionDate || undefined,
        referenceNumber: paymentForm.referenceNumber.trim() || undefined,
        description: paymentForm.description.trim() || undefined,
        markAsPaid: paymentForm.markAsPaid,
      });
      notify.success(t("payment.success"));
      setIsPaymentModalOpen(false);
      setSelectedPaySlip(null);
      await refreshPayroll();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("payment.error")));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const columns: DataTableColumn<PayrollPaySlip>[] = [
    { key: "employeeId", label: t("table.employee"), accessor: "employee.fullName", searchable: true, render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.employee.fullName}</span> },
    { key: "contractId", label: t("table.contract"), accessor: "contract.contractType", filterable: true, type: "select", options: contracts.map((contract) => ({ value: contract.id, label: `${contract.employee.fullName} - ${contract.contractType}` })), render: (row) => <Badge tone="outline">{row.contract.contractType}</Badge> },
    { key: "payPeriodStart", label: t("table.period"), sortable: true, render: (row) => `${formatDate(row.payPeriodStart)} - ${formatDate(row.payPeriodEnd)}` },
    { key: "grossAmount", label: t("table.gross"), sortable: true, render: (row) => formatCurrency(row.grossAmount, row.currency) },
    { key: "totalDeductions", label: t("table.deductions"), render: (row) => formatCurrency(row.totalDeductions, row.currency) },
    { key: "netAmount", label: t("table.net"), sortable: true, render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(row.netAmount, row.currency)}</span> },
    {
      key: "status",
      label: t("table.status"),
      filterable: true,
      type: "select",
      options: [
        { value: "draft", label: t("statuses.draft") },
        { value: "issued", label: t("statuses.issued") },
        { value: "paid", label: t("statuses.paid") },
        { value: "cancelled", label: t("statuses.cancelled") },
      ],
      render: (row) => <Badge tone={row.status === "paid" ? "success" : row.status === "issued" ? "info" : "outline"}>{t(`statuses.${row.status}`)}</Badge>,
    },
    {
      key: "finance",
      label: t("table.finance"),
      render: (row) =>
        row.linkedTransactionsCount > 0 || row.linkedJournalLinesCount > 0 ? (
          <div className="flex flex-wrap gap-2">
            {row.linkedTransactionsCount > 0 ? <Badge tone="success">{t("table.paymentLinked", { count: row.linkedTransactionsCount })}</Badge> : null}
            {row.linkedJournalLinesCount > 0 ? <Badge tone="info">{t("table.journalLinked", { count: row.linkedJournalLinesCount })}</Badge> : null}
          </div>
        ) : (
          <span className="text-slate-400">{t("table.na")}</span>
        ),
    },
    { key: "updatedAt", label: t("table.updatedAt"), sortable: true, render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <section className="grid gap-6">
      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("description")}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" leftIcon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => navigate({ to: "/payroll/contracts" })}>{t("contracts.open")}</Button>
          <Button variant="secondary" leftIcon={<Calculator className="h-4 w-4" />} onClick={() => setIsGenerateModalOpen(true)}>{t("generate.open")}</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("stats.activeContracts")} value={overview?.kpis.activeContracts ?? 0} icon={<FileSpreadsheet className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.totalPaySlips")} value={overview?.kpis.totalPaySlips ?? paySlipsQuery.data?.count ?? 0} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.draftPaySlips")} value={overview?.kpis.draftPaySlips ?? 0} icon={<Calculator className="h-6 w-6" />} />
          <SummaryStatCard label={t("stats.paidPaySlips")} value={overview?.kpis.paidPaySlips ?? 0} icon={<BadgeCheck className="h-6 w-6" />} />
        </div>
      </Card>

      <DataTable<PayrollPaySlip>
        tableId="payroll-payslips-table"
        data={paySlipsQuery.data ?? { results: [], count: 0, next: null, previous: null, current_page: 1, total_pages: 1 }}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={paySlipsQuery.isLoading || overviewQuery.isLoading}
        error={paySlipsQuery.isError ? t("table.loadError") : null}
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
          resetPaySlipForm();
          setIsPaySlipModalOpen(true);
        }}
        renderActions={(row) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" leftIcon={<ReceiptText className="h-4 w-4" />} onClick={() => navigate({ to: "/payroll/$paySlipId", params: { paySlipId: row.id } })}>{t("actions.view")}</Button>
            {row.status === "draft" ? (
              <>
                <Button variant="secondary" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => { hydratePaySlipForm(row); setIsPaySlipModalOpen(true); }}>{t("actions.edit")}</Button>
                <Button variant="secondary" size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={() => void handleIssue(row)}>{t("actions.issue")}</Button>
                <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => void handleDelete(row)}>{t("actions.delete")}</Button>
              </>
            ) : null}
            {row.status === "issued" ? <Button variant="secondary" size="sm" leftIcon={<Wallet className="h-4 w-4" />} onClick={() => void handleMarkPaid(row)}>{t("actions.markPaid")}</Button> : null}
            {financeEnabled && row.status !== "draft" && row.linkedJournalLinesCount === 0 ? <Button variant="secondary" size="sm" leftIcon={<Landmark className="h-4 w-4" />} onClick={() => { setSelectedPaySlip(row); setIsJournalEntryModalOpen(true); }}>{t("actions.createJournalEntry")}</Button> : null}
            {financeEnabled && row.status === "issued" && row.linkedTransactionsCount === 0 ? <Button variant="secondary" size="sm" leftIcon={<Coins className="h-4 w-4" />} onClick={() => { setSelectedPaySlip(row); setIsPaymentModalOpen(true); }}>{t("actions.registerPayment")}</Button> : null}
          </div>
        )}
      />

      {isPaySlipModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{editingPaySlipId ? t("create.editTitle") : t("create.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{editingPaySlipId ? t("create.editDescription") : t("create.description")}</p></div><button type="button" onClick={() => { setIsPaySlipModalOpen(false); resetPaySlipForm(); }} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.contract")}</span><select value={paySlipForm.contractId} onChange={(event) => handleSelectContract(event.target.value)} disabled={Boolean(editingPaySlipId)} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("create.contractPlaceholder")}</option>{contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.employee.fullName} - {contract.contractType}</option>)}</select></label>
            <Field label={t("create.payPeriodStart")} type="date" value={paySlipForm.payPeriodStart} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, payPeriodStart: event.target.value }))} />
            <Field label={t("create.payPeriodEnd")} type="date" value={paySlipForm.payPeriodEnd} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, payPeriodEnd: event.target.value }))} />
            <Field label={t("create.paymentDate")} type="date" value={paySlipForm.paymentDate} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, paymentDate: event.target.value }))} />
            <Field label={t("create.currency")} value={paySlipForm.currency} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />
            <Field label={t("create.notes")} value={paySlipForm.notes} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </div>

          <div className="mt-8 grid gap-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("create.linesTitle")}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{t("create.linesDescription")}</p></div><Button variant="secondary" leftIcon={<PlusCircle className="h-4 w-4" />} onClick={() => setPaySlipForm((prev) => ({ ...prev, lines: [...prev.lines, buildEmptyPaySlipLine(defaultSalaryLabel)] }))}>{t("create.addLine")}</Button></div>
            <div className="grid gap-4">
              {paySlipForm.lines.map((line, index) => (
                <Card key={`${index}-${line.label}`} className="grid gap-4 p-4">
                  <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t("create.lineTitle", { index: index + 1 })}</h4>{paySlipForm.lines.length > 1 ? <button type="button" onClick={() => setPaySlipForm((prev) => ({ ...prev, lines: prev.lines.filter((_, lineIndex) => lineIndex !== index) }))} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" /></button> : null}</div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("create.lineType")}</span><select value={line.lineType} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, lines: prev.lines.map((current, lineIndex) => lineIndex === index ? { ...current, lineType: event.target.value as PaySlipLineType } : current) }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="earning">{t("lineTypes.earning")}</option><option value="deduction">{t("lineTypes.deduction")}</option><option value="tax">{t("lineTypes.tax")}</option><option value="benefit">{t("lineTypes.benefit")}</option></select></label>
                    <Field label={t("create.lineLabel")} value={line.label} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, lines: prev.lines.map((current, lineIndex) => lineIndex === index ? { ...current, label: event.target.value } : current) }))} />
                    <Field label={t("create.lineAmount")} type="number" value={line.amount} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, lines: prev.lines.map((current, lineIndex) => lineIndex === index ? { ...current, amount: event.target.value } : current) }))} />
                    <Field label={t("create.lineDescription")} value={line.description} onChange={(event) => setPaySlipForm((prev) => ({ ...prev, lines: prev.lines.map((current, lineIndex) => lineIndex === index ? { ...current, description: event.target.value } : current) }))} />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => { setIsPaySlipModalOpen(false); resetPaySlipForm(); }}>{t("create.cancel")}</Button><Button onClick={() => void handleSavePaySlip()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingPaySlip}>{isSubmittingPaySlip ? t("create.submitting") : editingPaySlipId ? t("create.editSubmit") : t("create.submit")}</Button></div>
        </div></div>
      ) : null}

      {isGenerateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("generate.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("generate.description")}</p></div><button type="button" onClick={() => setIsGenerateModalOpen(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label={t("generate.payPeriodStart")} type="date" value={generateForm.payPeriodStart} onChange={(event) => setGenerateForm((prev) => ({ ...prev, payPeriodStart: event.target.value }))} />
            <Field label={t("generate.payPeriodEnd")} type="date" value={generateForm.payPeriodEnd} onChange={(event) => setGenerateForm((prev) => ({ ...prev, payPeriodEnd: event.target.value }))} />
            <Field label={t("generate.paymentDate")} type="date" value={generateForm.paymentDate} onChange={(event) => setGenerateForm((prev) => ({ ...prev, paymentDate: event.target.value }))} />
            <Field label={t("generate.earningLabel")} value={generateForm.earningLabel} onChange={(event) => setGenerateForm((prev) => ({ ...prev, earningLabel: event.target.value }))} />
          </div>
          <div className="mt-4"><Field label={t("generate.notes")} value={generateForm.notes} onChange={(event) => setGenerateForm((prev) => ({ ...prev, notes: event.target.value }))} /></div>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={generateForm.skipExisting} onChange={(event) => setGenerateForm((prev) => ({ ...prev, skipExisting: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span>{t("generate.skipExisting")}</span></label>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>{t("generate.cancel")}</Button><Button onClick={() => void handleGeneratePayRun()} leftIcon={<Calculator className="h-4 w-4" />} disabled={isSubmittingGenerate}>{isSubmittingGenerate ? t("generate.submitting") : t("generate.submit")}</Button></div>
        </div></div>
      ) : null}

      {isJournalEntryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("journalEntry.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("journalEntry.description")}</p></div><button type="button" onClick={() => { setIsJournalEntryModalOpen(false); setSelectedPaySlip(null); }} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.expenseAccount")}</span><select value={journalEntryForm.expenseAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, expenseAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.accountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.payableAccount")}</span><select value={journalEntryForm.payrollPayableAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, payrollPayableAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.accountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.deductionsAccount")}</span><select value={journalEntryForm.deductionsPayableAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, deductionsPayableAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.optionalAccountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <Field label={t("journalEntry.entryDate")} type="date" value={journalEntryForm.entryDate} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, entryDate: event.target.value }))} />
            <Field label={t("journalEntry.entryNumber")} value={journalEntryForm.entryNumber} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, entryNumber: event.target.value }))} />
            <Field label={t("journalEntry.descriptionField")} value={journalEntryForm.description} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => { setIsJournalEntryModalOpen(false); setSelectedPaySlip(null); }}>{t("journalEntry.cancel")}</Button><Button onClick={() => void handleCreateJournalEntry()} leftIcon={<Landmark className="h-4 w-4" />} disabled={isSubmittingJournalEntry}>{isSubmittingJournalEntry ? t("journalEntry.submitting") : t("journalEntry.submit")}</Button></div>
        </div></div>
      ) : null}

      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("payment.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("payment.description")}</p></div><button type="button" onClick={() => { setIsPaymentModalOpen(false); setSelectedPaySlip(null); }} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("payment.transactionType")}</span><select value={paymentForm.transactionTypeId} onChange={(event) => setPaymentForm((prev) => ({ ...prev, transactionTypeId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("payment.transactionTypePlaceholder")}</option>{transactionTypes.map((transactionType) => <option key={transactionType.id} value={transactionType.id}>{transactionType.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("payment.paymentMethod")}</span><select value={paymentForm.paymentMethodId} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMethodId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("payment.paymentMethodPlaceholder")}</option>{paymentMethods.map((paymentMethod) => <option key={paymentMethod.id} value={paymentMethod.id}>{paymentMethod.name}</option>)}</select></label>
            <Field label={t("payment.transactionDate")} type="date" value={paymentForm.transactionDate} onChange={(event) => setPaymentForm((prev) => ({ ...prev, transactionDate: event.target.value }))} />
            <Field label={t("payment.referenceNumber")} value={paymentForm.referenceNumber} onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
          </div>
          <div className="mt-4"><Field label={t("payment.descriptionField")} value={paymentForm.description} onChange={(event) => setPaymentForm((prev) => ({ ...prev, description: event.target.value }))} /></div>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={paymentForm.markAsPaid} onChange={(event) => setPaymentForm((prev) => ({ ...prev, markAsPaid: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span>{t("payment.markAsPaid")}</span></label>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => { setIsPaymentModalOpen(false); setSelectedPaySlip(null); }}>{t("payment.cancel")}</Button><Button onClick={() => void handleRegisterPayment()} leftIcon={<Coins className="h-4 w-4" />} disabled={isSubmittingPayment}>{isSubmittingPayment ? t("payment.submitting") : t("payment.submit")}</Button></div>
        </div></div>
      ) : null}
    </section>
  );
}
