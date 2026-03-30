import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Coins, FileSpreadsheet, Landmark, ReceiptText, Send, Trash2, Wallet, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";
import { financeQueryKeys, useAccountingAccounts, usePaymentMethods, useTransactionTypes } from "@/modules/finance/hooks/useFinance";
import { createPayrollJournalEntry, issuePayrollPaySlip, markPayrollPaySlipPaid, registerPayrollPayment, removePayrollPaySlip } from "@/modules/payroll/api/payroll.api";
import { payrollQueryKeys, usePayrollPaySlipDetail } from "@/modules/payroll/hooks/usePayroll";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Spinner } from "@/shared/ui";
import { Field } from "@/shared/ui";

type PayrollPaySlipDetailPageProps = {
  paySlipId: string;
};

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

export function PayrollPaySlipDetailPage({ paySlipId }: PayrollPaySlipDetailPageProps) {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useAccessSession();
  const financeEnabled = session?.modules.includes("finance") ?? false;
  const [isJournalEntryModalOpen, setIsJournalEntryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingJournalEntry, setIsSubmittingJournalEntry] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [journalEntryForm, setJournalEntryForm] = useState({
    expenseAccountId: "",
    payrollPayableAccountId: "",
    deductionsPayableAccountId: "",
    entryDate: "",
    entryNumber: "",
    description: "",
    status: "draft" as "draft" | "posted",
  });
  const [paymentForm, setPaymentForm] = useState({
    transactionTypeId: "",
    paymentMethodId: "",
    transactionDate: "",
    referenceNumber: "",
    description: "",
    markAsPaid: true,
  });
  const detailQuery = usePayrollPaySlipDetail(paySlipId);
  const accountsQuery = useAccountingAccounts(financeEnabled);
  const paymentMethodsQuery = usePaymentMethods(financeEnabled);
  const transactionTypesQuery = useTransactionTypes(financeEnabled);
  const paySlip = detailQuery.data;
  const accounts = accountsQuery.data ?? [];
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const transactionTypes = transactionTypesQuery.data ?? [];

  const refreshPaySlip = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: payrollQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: payrollQueryKeys.paySlipDetail(paySlipId) }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
    ]);
  };

  const handleIssue = async () => {
    if (!paySlip) return;
    try {
      await issuePayrollPaySlip(paySlip.id);
      notify.success(t("actions.issueSuccess"));
      await refreshPaySlip();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.issueError")));
    }
  };

  const handleMarkPaid = async () => {
    if (!paySlip) return;
    try {
      await markPayrollPaySlipPaid(paySlip.id, {});
      notify.success(t("actions.markPaidSuccess"));
      await refreshPaySlip();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.markPaidError")));
    }
  };

  const handleDelete = async () => {
    if (!paySlip) return;
    try {
      await removePayrollPaySlip(paySlip.id);
      notify.success(t("actions.deleteSuccess"));
      await queryClient.invalidateQueries({ queryKey: payrollQueryKeys.root });
      navigate({ to: "/payroll" });
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("actions.deleteError")));
    }
  };

  const handleCreateJournalEntry = async () => {
    if (!paySlip || !journalEntryForm.expenseAccountId || !journalEntryForm.payrollPayableAccountId) {
      notify.error(t("journalEntry.validationError"));
      return;
    }
    setIsSubmittingJournalEntry(true);
    try {
      await createPayrollJournalEntry(paySlip.id, {
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
      await refreshPaySlip();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("journalEntry.error")));
    } finally {
      setIsSubmittingJournalEntry(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!paySlip || !paymentForm.transactionTypeId || !paymentForm.paymentMethodId) {
      notify.error(t("payment.validationError"));
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await registerPayrollPayment(paySlip.id, {
        transactionTypeId: paymentForm.transactionTypeId,
        paymentMethodId: paymentForm.paymentMethodId,
        transactionDate: paymentForm.transactionDate || undefined,
        referenceNumber: paymentForm.referenceNumber.trim() || undefined,
        description: paymentForm.description.trim() || undefined,
        markAsPaid: paymentForm.markAsPaid,
      });
      notify.success(t("payment.success"));
      setIsPaymentModalOpen(false);
      await refreshPaySlip();
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("payment.error")));
    } finally {
      setIsSubmittingPayment(false);
    }
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

  if (detailQuery.isError || !paySlip) {
    return (
      <section className="grid gap-4">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/payroll" })}>
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
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/payroll" })}>
          {t("detail.back")}
        </Button>
        {paySlip.status === "draft" ? (
          <>
            <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} onClick={() => void handleIssue()}>
              {t("actions.issue")}
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => void handleDelete()}>
              {t("actions.delete")}
            </Button>
          </>
        ) : null}
        {paySlip.status === "issued" ? (
          <Button variant="secondary" leftIcon={<Wallet className="h-4 w-4" />} onClick={() => void handleMarkPaid()}>
            {t("actions.markPaid")}
          </Button>
        ) : null}
        {financeEnabled && paySlip.status !== "draft" && paySlip.linkedJournalLinesCount === 0 ? (
          <Button variant="secondary" leftIcon={<Landmark className="h-4 w-4" />} onClick={() => setIsJournalEntryModalOpen(true)}>
            {t("actions.createJournalEntry")}
          </Button>
        ) : null}
        {financeEnabled && paySlip.status === "issued" && paySlip.linkedTransactionsCount === 0 ? (
          <Button variant="secondary" leftIcon={<Coins className="h-4 w-4" />} onClick={() => setIsPaymentModalOpen(true)}>
            {t("actions.registerPayment")}
          </Button>
        ) : null}
      </div>

      <Card className="grid gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{paySlip.employee.fullName}</h1>
              <Badge tone={paySlip.status === "paid" ? "success" : paySlip.status === "issued" ? "info" : "outline"}>{t(`statuses.${paySlip.status}`)}</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {paySlip.contract.contractType} · {formatDate(paySlip.payPeriodStart)} - {formatDate(paySlip.payPeriodEnd)}
            </p>
          </div>
          <div className="grid gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span>{t("detail.updatedAt")}</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatDate(paySlip.updatedAt)}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStatCard label={t("detail.gross")} value={formatCurrency(paySlip.grossAmount, paySlip.currency)} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.deductions")} value={formatCurrency(paySlip.totalDeductions, paySlip.currency)} icon={<Wallet className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.net")} value={formatCurrency(paySlip.netAmount, paySlip.currency)} icon={<BadgeCheck className="h-6 w-6" />} />
          <SummaryStatCard label={t("detail.journalLinks")} value={paySlip.linkedJournalLinesCount} icon={<Landmark className="h-6 w-6" />} />
        </div>
      </Card>

      <Card className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.linkedTransactionsTitle")}</h2>
          {paySlip.linkedTransactions && paySlip.linkedTransactions.length > 0 ? (
            paySlip.linkedTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{transaction.accountingCategory}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(transaction.transactionDate)} · {transaction.referenceNumber || t("table.na")}</p>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(transaction.amount, paySlip.currency)}</span>
                </div>
                {transaction.description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{transaction.description}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.emptyTransactions")}</p>
          )}
        </div>

        <div className="grid gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.linkedJournalEntriesTitle")}</h2>
          {paySlip.linkedJournalEntries && paySlip.linkedJournalEntries.length > 0 ? (
            paySlip.linkedJournalEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-background/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{entry.entryNumber}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(entry.entryDate)} · {entry.status}</p>
                  </div>
                  <Badge tone={entry.status === "posted" ? "success" : "outline"}>{entry.status}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.emptyJournalEntries")}</p>
          )}
        </div>
      </Card>

      <Card className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.summaryTitle")}</h2>
          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
            <p>{t("detail.employeeNumber")}: <span className="font-medium text-slate-900 dark:text-white">{paySlip.employee.employeeNumber}</span></p>
            <p>{t("detail.contractType")}: <span className="font-medium text-slate-900 dark:text-white">{paySlip.contract.contractType}</span></p>
            <p>{t("detail.paymentDate")}: <span className="font-medium text-slate-900 dark:text-white">{formatDate(paySlip.paymentDate)}</span></p>
            <p>{t("detail.issuedAt")}: <span className="font-medium text-slate-900 dark:text-white">{formatDate(paySlip.issuedAt)}</span></p>
            <p>{t("detail.notes")}: <span className="font-medium text-slate-900 dark:text-white">{paySlip.notes || t("table.na")}</span></p>
          </div>
        </div>

        <div className="grid gap-3">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.financeTitle")}</h2>
          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
            <p>{t("detail.transactionsCount")}: <span className="font-medium text-slate-900 dark:text-white">{paySlip.linkedTransactionsCount}</span></p>
            <p>{t("detail.journalLinesCount")}: <span className="font-medium text-slate-900 dark:text-white">{paySlip.linkedJournalLinesCount}</span></p>
            <p>{t("detail.createdAt")}: <span className="font-medium text-slate-900 dark:text-white">{formatDate(paySlip.createdAt)}</span></p>
          </div>
        </div>
      </Card>

      <Card className="grid gap-4 p-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-slate-500" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("detail.linesTitle")}</h2>
        </div>
        <div className="grid gap-3">
          {paySlip.lines.map((line) => (
            <div key={line.id} className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{line.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t(`lineTypes.${line.lineType}`, { defaultValue: line.lineType })}</p>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(line.amount, paySlip.currency)}</span>
              </div>
              {line.description ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{line.description}</p> : null}
            </div>
          ))}
        </div>
      </Card>

      {isJournalEntryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("journalEntry.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("journalEntry.description")}</p></div><button type="button" onClick={() => setIsJournalEntryModalOpen(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.expenseAccount")}</span><select value={journalEntryForm.expenseAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, expenseAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.accountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.payableAccount")}</span><select value={journalEntryForm.payrollPayableAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, payrollPayableAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.accountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("journalEntry.deductionsAccount")}</span><select value={journalEntryForm.deductionsPayableAccountId} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, deductionsPayableAccountId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("journalEntry.optionalAccountPlaceholder")}</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
            <Field label={t("journalEntry.entryDate")} type="date" value={journalEntryForm.entryDate} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, entryDate: event.target.value }))} />
            <Field label={t("journalEntry.entryNumber")} value={journalEntryForm.entryNumber} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, entryNumber: event.target.value }))} />
            <Field label={t("journalEntry.descriptionField")} value={journalEntryForm.description} onChange={(event) => setJournalEntryForm((prev) => ({ ...prev, description: event.target.value }))} />
          </div>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsJournalEntryModalOpen(false)}>{t("journalEntry.cancel")}</Button><Button onClick={() => void handleCreateJournalEntry()} leftIcon={<Landmark className="h-4 w-4" />} disabled={isSubmittingJournalEntry}>{isSubmittingJournalEntry ? t("journalEntry.submitting") : t("journalEntry.submit")}</Button></div>
        </div></div>
      ) : null}

      {isPaymentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("payment.title")}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("payment.description")}</p></div><button type="button" onClick={() => setIsPaymentModalOpen(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("payment.transactionType")}</span><select value={paymentForm.transactionTypeId} onChange={(event) => setPaymentForm((prev) => ({ ...prev, transactionTypeId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("payment.transactionTypePlaceholder")}</option>{transactionTypes.map((transactionType) => <option key={transactionType.id} value={transactionType.id}>{transactionType.name}</option>)}</select></label>
            <label className="grid gap-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("payment.paymentMethod")}</span><select value={paymentForm.paymentMethodId} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paymentMethodId: event.target.value }))} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><option value="">{t("payment.paymentMethodPlaceholder")}</option>{paymentMethods.map((paymentMethod) => <option key={paymentMethod.id} value={paymentMethod.id}>{paymentMethod.name}</option>)}</select></label>
            <Field label={t("payment.transactionDate")} type="date" value={paymentForm.transactionDate} onChange={(event) => setPaymentForm((prev) => ({ ...prev, transactionDate: event.target.value }))} />
            <Field label={t("payment.referenceNumber")} value={paymentForm.referenceNumber} onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} />
          </div>
          <div className="mt-4"><Field label={t("payment.descriptionField")} value={paymentForm.description} onChange={(event) => setPaymentForm((prev) => ({ ...prev, description: event.target.value }))} /></div>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={paymentForm.markAsPaid} onChange={(event) => setPaymentForm((prev) => ({ ...prev, markAsPaid: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span>{t("payment.markAsPaid")}</span></label>
          <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>{t("payment.cancel")}</Button><Button onClick={() => void handleRegisterPayment()} leftIcon={<Coins className="h-4 w-4" />} disabled={isSubmittingPayment}>{isSubmittingPayment ? t("payment.submitting") : t("payment.submit")}</Button></div>
        </div></div>
      ) : null}
    </section>
  );
}
