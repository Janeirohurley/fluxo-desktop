import { useMemo, useState } from "react";
import { ArrowLeft, BadgeDollarSign, Landmark, Plus, ReceiptText, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  useAccountingAccounts,
  usePaymentMethods,
  useTransactionTypes,
} from "@/modules/finance/hooks/useFinance";
import {
  useCreateAccountingAccount,
  useCreatePaymentMethod,
  useCreateTransactionType,
  useDeleteAccountingAccount,
  useDeletePaymentMethod,
  useDeleteTransactionType,
  useUpdateAccountingAccount,
  useUpdatePaymentMethod,
  useUpdateTransactionType,
} from "@/modules/finance/hooks/useFinanceReferences";
import { ReferenceTableSection } from "@/modules/finance/components/ReferenceTableSection";
import { type AccountingAccount } from "@/modules/finance/types/finance.types";
import { SummaryStatCard } from "@/modules/dashboard/components/SummaryStatCard";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type ReferenceSectionKey = "paymentMethods" | "transactionTypes" | "accounts";

type AccountFormState = {
  code: string;
  name: string;
  accountType: AccountingAccount["accountType"];
  isActive: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function buildInitialAccountForm(): AccountFormState {
  return {
    code: "",
    name: "",
    accountType: "asset",
    isActive: true,
  };
}

export function FinanceReferencesPage() {
  const { t } = useTranslation("finance");
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ReferenceSectionKey>("paymentMethods");
  const [accountSearch, setAccountSearch] = useState("");
  const [currentAccountPage, setCurrentAccountPage] = useState(1);
  const [accountItemsPerPage, setAccountItemsPerPage] = useState(10);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(buildInitialAccountForm());

  const paymentMethodsQuery = usePaymentMethods();
  const transactionTypesQuery = useTransactionTypes();
  const accountsQuery = useAccountingAccounts();

  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const createTransactionType = useCreateTransactionType();
  const updateTransactionType = useUpdateTransactionType();
  const deleteTransactionType = useDeleteTransactionType();

  const createAccount = useCreateAccountingAccount();
  const updateAccount = useUpdateAccountingAccount();
  const deleteAccount = useDeleteAccountingAccount();

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const transactionTypes = transactionTypesQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = accountSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return accounts;
    }

    return accounts.filter(
      (account) =>
        account.code.toLowerCase().includes(normalizedSearch) ||
        account.name.toLowerCase().includes(normalizedSearch) ||
        account.accountType.toLowerCase().includes(normalizedSearch),
    );
  }, [accounts, accountSearch]);

  const sections = [
    { key: "paymentMethods" as const, icon: ReceiptText, count: paymentMethods.length },
    { key: "transactionTypes" as const, icon: BadgeDollarSign, count: transactionTypes.length },
    { key: "accounts" as const, icon: Landmark, count: accounts.length },
  ];

  const accountTypeOptions = (["asset", "liability", "equity", "revenue", "expense"] as const).map((type) => ({
    value: type,
    label: t(`accountTypes.${type}`),
  }));

  const accountColumns: DataTableColumn<AccountingAccount>[] = [
    {
      key: "code",
      label: t("references.accounts.table.code"),
      sortable: true,
      searchable: true,
      editable: true,
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.code}</span>,
    },
    {
      key: "name",
      label: t("references.accounts.table.name"),
      sortable: true,
      searchable: true,
      editable: true,
    },
    {
      key: "accountType",
      label: t("references.accounts.table.accountType"),
      sortable: true,
      editable: true,
      type: "select",
      options: accountTypeOptions,
      render: (row) => <Badge tone="outline">{t(`accountTypes.${row.accountType}`)}</Badge>,
    },
    {
      key: "isActive",
      label: t("references.accounts.table.isActive"),
      sortable: true,
      editable: true,
      type: "select",
      options: [
        { value: "true", label: t("references.accounts.active") },
        { value: "false", label: t("references.accounts.inactive") },
      ],
      render: (row) => (
        <Badge tone={row.isActive ? "success" : "outline"}>
          {row.isActive ? t("references.accounts.active") : t("references.accounts.inactive")}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      label: t("references.accounts.table.updatedAt"),
      sortable: true,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  const handleCreateAccount = async () => {
    if (!accountForm.code.trim() || !accountForm.name.trim()) {
      notify.error(t("references.accounts.createValidationError"));
      return;
    }

    setIsSubmittingAccount(true);

    try {
      await createAccount.mutateAsync({
        code: accountForm.code.trim(),
        name: accountForm.name.trim(),
        accountType: accountForm.accountType,
        isActive: accountForm.isActive,
      });

      notify.success(t("references.accounts.createSuccess"));
      setAccountForm(buildInitialAccountForm());
      setIsCreateAccountOpen(false);
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("references.accounts.createError")));
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleUpdateAccount = async (rowId: string | number, columnKey: string, newValue: string) => {
    try {
      switch (columnKey) {
        case "code":
          await updateAccount.mutateAsync({ id: String(rowId), payload: { code: newValue.trim() } });
          break;
        case "name":
          await updateAccount.mutateAsync({ id: String(rowId), payload: { name: newValue.trim() } });
          break;
        case "accountType":
          await updateAccount.mutateAsync({
            id: String(rowId),
            payload: { accountType: newValue as AccountingAccount["accountType"] },
          });
          break;
        case "isActive":
          await updateAccount.mutateAsync({ id: String(rowId), payload: { isActive: newValue === "true" } });
          break;
        default:
          return;
      }

      notify.success(t("references.accounts.updateSuccess"));
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("references.accounts.updateError")));
      throw error;
    }
  };

  const handleDeleteAccount = async (row: AccountingAccount) => {
    try {
      await deleteAccount.mutateAsync(row.id);
      notify.success(t("references.accounts.deleteSuccess"));
    } catch (error) {
      notify.error(resolveErrorMessage(error, t("references.accounts.deleteError")));
    }
  };

  return (
    <section className="grid gap-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: "/finance" })}>
          {t("references.back")}
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{t("references.title")}</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("references.description")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryStatCard label={t("references.stats.paymentMethods")} value={paymentMethods.length} icon={<ReceiptText className="h-6 w-6" />} />
          <SummaryStatCard label={t("references.stats.transactionTypes")} value={transactionTypes.length} icon={<BadgeDollarSign className="h-6 w-6" />} />
          <SummaryStatCard label={t("references.stats.accounts")} value={accounts.length} icon={<Landmark className="h-6 w-6" />} />
        </div>

        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeSection === section.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(`references.sections.${section.key}.title`)}</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{section.count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {activeSection === "paymentMethods" ? (
        <ReferenceTableSection
          sectionKey="paymentMethods"
          tableId="finance-payment-methods-table"
          data={paymentMethods}
          isLoading={paymentMethodsQuery.isLoading || createPaymentMethod.isPending || updatePaymentMethod.isPending || deletePaymentMethod.isPending}
          error={paymentMethodsQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createPaymentMethod.mutateAsync({ name })}
          onUpdate={(id, name) => updatePaymentMethod.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deletePaymentMethod.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "transactionTypes" ? (
        <ReferenceTableSection
          sectionKey="transactionTypes"
          tableId="finance-transaction-types-table"
          data={transactionTypes}
          isLoading={transactionTypesQuery.isLoading || createTransactionType.isPending || updateTransactionType.isPending || deleteTransactionType.isPending}
          error={transactionTypesQuery.isError ? t("references.table.loadError") : null}
          onCreate={(name) => createTransactionType.mutateAsync({ name })}
          onUpdate={(id, name) => updateTransactionType.mutateAsync({ id, payload: { name } })}
          onDelete={(row) => deleteTransactionType.mutateAsync(row.id)}
        />
      ) : null}

      {activeSection === "accounts" ? (
        <Card className="grid gap-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("references.sections.accounts.title")}</h2>
                <Badge tone="outline">{accounts.length}</Badge>
              </div>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                {t("references.sections.accounts.description")}
              </p>
            </div>
          </div>

          <DataTable<AccountingAccount>
            tableId="finance-accounts-table"
            data={filteredAccounts}
            columns={accountColumns}
            currentPage={currentAccountPage}
            setCurrentPage={setCurrentAccountPage}
            itemsPerPage={accountItemsPerPage}
            setItemsPerPage={setAccountItemsPerPage}
            onSearchChange={(value) => {
              setCurrentAccountPage(1);
              setAccountSearch(value);
            }}
            isLoading={accountsQuery.isLoading || createAccount.isPending || updateAccount.isPending || deleteAccount.isPending}
            error={accountsQuery.isError ? t("references.table.loadError") : null}
            onAddRow={() => {
              setAccountForm(buildInitialAccountForm());
              setIsCreateAccountOpen(true);
            }}
            onCellEdit={handleUpdateAccount}
            onDeleteRow={(row) => {
              void handleDeleteAccount(row);
            }}
          />
        </Card>
      ) : null}

      {isCreateAccountOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t("references.accounts.createTitle")}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("references.accounts.createDescription")}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateAccountOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label={t("references.accounts.fields.code")}
                value={accountForm.code}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, code: event.target.value }))}
              />
              <Field
                label={t("references.accounts.fields.name")}
                value={accountForm.name}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, name: event.target.value }))}
              />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("references.accounts.fields.accountType")}</span>
                <select
                  value={accountForm.accountType}
                  onChange={(event) =>
                    setAccountForm((prev) => ({ ...prev, accountType: event.target.value as AccountingAccount["accountType"] }))
                  }
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  {accountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("references.accounts.fields.status")}</span>
                <select
                  value={String(accountForm.isActive)}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="true">{t("references.accounts.active")}</option>
                  <option value="false">{t("references.accounts.inactive")}</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateAccountOpen(false)}>
                {t("references.form.cancel")}
              </Button>
              <Button onClick={() => void handleCreateAccount()} leftIcon={<Plus className="h-4 w-4" />} disabled={isSubmittingAccount}>
                {isSubmittingAccount ? t("references.form.submitting") : t("references.form.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
