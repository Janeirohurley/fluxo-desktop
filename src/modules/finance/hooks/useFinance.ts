import { useQuery } from "@tanstack/react-query";
import {
  fetchAccountingAccounts,
  fetchFinanceTransactions,
  fetchJournalEntries,
  fetchPaymentMethods,
  fetchReconciliations,
  fetchTransactionTypes,
} from "@/modules/finance/api/finance.api";
import {
  type FinanceTransactionListParams,
  type JournalEntryListParams,
  type ReconciliationListParams,
} from "@/modules/finance/types/finance.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const financeQueryKeys = {
  root: ["finance"] as const,
  transactions: (params: FinanceTransactionListParams) => ["finance", "transactions", params] as const,
  journalEntries: (params: JournalEntryListParams) => ["finance", "journal-entries", params] as const,
  reconciliations: (params: ReconciliationListParams) => ["finance", "reconciliations", params] as const,
  paymentMethods: ["finance", "payment-methods"] as const,
  transactionTypes: ["finance", "transaction-types"] as const,
  accounts: ["finance", "accounts"] as const,
};

export function useFinanceTransactions(params: FinanceTransactionListParams) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.transactions(params),
    queryFn: () => fetchFinanceTransactions(params),
    enabled: Boolean(accessKey),
  });
}

export function usePaymentMethods() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.paymentMethods,
    queryFn: fetchPaymentMethods,
    enabled: Boolean(accessKey),
  });
}

export function useJournalEntries(params: JournalEntryListParams) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.journalEntries(params),
    queryFn: () => fetchJournalEntries(params),
    enabled: Boolean(accessKey),
  });
}

export function useTransactionTypes() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.transactionTypes,
    queryFn: fetchTransactionTypes,
    enabled: Boolean(accessKey),
  });
}

export function useAccountingAccounts() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.accounts,
    queryFn: fetchAccountingAccounts,
    enabled: Boolean(accessKey),
  });
}

export function useReconciliations(params: ReconciliationListParams) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: financeQueryKeys.reconciliations(params),
    queryFn: () => fetchReconciliations(params),
    enabled: Boolean(accessKey),
  });
}
