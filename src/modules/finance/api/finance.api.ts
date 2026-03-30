import { apiClient } from "@/shared/api/client";
import {
  type AccountingAccount,
  type CreateJournalEntryPayload,
  type CreateAccountingAccountPayload,
  type CreateFinanceTransactionPayload,
  type CreatePaymentMethodPayload,
  type CreateReconciliationItemPayload,
  type CreateReconciliationPayload,
  type CreateTransactionTypePayload,
  type JournalEntryListParams,
  type JournalEntryListResponse,
  type JournalEntryRecord,
  type FinanceTransactionListParams,
  type FinanceTransactionListResponse,
  type FinanceTransactionRecord,
  type PaymentMethodReference,
  type ReconciliationListParams,
  type ReconciliationListResponse,
  type ReconciliationRecord,
  type ReconciliationItemRecord,
  type TransactionTypeReference,
  type UpdateAccountingAccountPayload,
  type UpdateFinanceTransactionPayload,
  type UpdatePaymentMethodPayload,
  type UpdateTransactionTypePayload,
} from "@/modules/finance/types/finance.types";

type ReferenceDto = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type AccountingAccountDto = {
  id: string;
  code: string;
  name: string;
  account_type: AccountingAccount["accountType"];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FinanceTransactionDto = {
  id: string;
  transaction_type_id: string;
  accounting_category: string;
  amount: number;
  payment_method_id: string;
  reference_number?: string | null;
  transaction_date: string;
  description?: string | null;
  employee_id?: string | null;
  asset_id?: string | null;
  pay_slip_id?: string | null;
  journal_entry_id?: string | null;
  payment_method?: ReferenceDto | null;
  transaction_type?: ReferenceDto | null;
  created_at: string;
  updated_at: string;
};

type PaginationDto = {
  count: number;
  page_size: number;
  current_page: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
};

type ListDto<T> = {
  data: T[];
  pagination?: PaginationDto;
};

type SingleDto<T> = {
  data: T;
};

type JournalEntryLineDto = {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string | null;
  employee_id?: string | null;
  asset_id?: string | null;
  pay_slip_id?: string | null;
  reference_number?: string | null;
  created_at: string;
  updated_at: string;
};

type JournalEntryDto = {
  id: string;
  entry_number: string;
  entry_date: string;
  description?: string | null;
  period_year: number;
  period_month: number;
  status: "draft" | "posted";
  posted_by?: string | null;
  posted_at?: string | null;
  lines: JournalEntryLineDto[];
  created_at: string;
  updated_at: string;
};

type ReconciliationItemDto = {
  id: string;
  reconciliation_id: string;
  transaction_id?: string | null;
  journal_entry_line_id?: string | null;
  matched_at: string;
  created_at: string;
  updated_at: string;
};

type ReconciliationDto = {
  id: string;
  reconciliation_type: string;
  account_id: string;
  statement_start_date: string;
  statement_end_date: string;
  statement_balance: number;
  book_balance: number;
  status: "open" | "closed";
  closed_by?: string | null;
  closed_at?: string | null;
  account?: AccountingAccountDto | null;
  items: ReconciliationItemDto[];
  created_at: string;
  updated_at: string;
};

function mapReference(dto: ReferenceDto): PaymentMethodReference {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapAccountingAccount(dto: AccountingAccountDto): AccountingAccount {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    accountType: dto.account_type,
    isActive: dto.is_active,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapTransaction(dto: FinanceTransactionDto): FinanceTransactionRecord {
  return {
    id: dto.id,
    transactionTypeId: dto.transaction_type_id,
    accountingCategory: dto.accounting_category,
    amount: dto.amount,
    paymentMethodId: dto.payment_method_id,
    referenceNumber: dto.reference_number ?? null,
    transactionDate: dto.transaction_date,
    description: dto.description ?? null,
    employeeId: dto.employee_id ?? null,
    assetId: dto.asset_id ?? null,
    paySlipId: dto.pay_slip_id ?? null,
    journalEntryId: dto.journal_entry_id ?? null,
    paymentMethod: dto.payment_method ? mapReference(dto.payment_method) : null,
    transactionType: dto.transaction_type ? mapReference(dto.transaction_type) : null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapJournalEntryLine(dto: JournalEntryLineDto) {
  return {
    id: dto.id,
    journalEntryId: dto.journal_entry_id,
    accountId: dto.account_id,
    debitAmount: dto.debit_amount,
    creditAmount: dto.credit_amount,
    description: dto.description ?? null,
    employeeId: dto.employee_id ?? null,
    assetId: dto.asset_id ?? null,
    paySlipId: dto.pay_slip_id ?? null,
    referenceNumber: dto.reference_number ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapJournalEntry(dto: JournalEntryDto): JournalEntryRecord {
  return {
    id: dto.id,
    entryNumber: dto.entry_number,
    entryDate: dto.entry_date,
    description: dto.description ?? null,
    periodYear: dto.period_year,
    periodMonth: dto.period_month,
    status: dto.status,
    postedBy: dto.posted_by ?? null,
    postedAt: dto.posted_at ?? null,
    lines: (dto.lines ?? []).map(mapJournalEntryLine),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapReconciliationItem(dto: ReconciliationItemDto): ReconciliationItemRecord {
  return {
    id: dto.id,
    reconciliationId: dto.reconciliation_id,
    transactionId: dto.transaction_id ?? null,
    journalEntryLineId: dto.journal_entry_line_id ?? null,
    matchedAt: dto.matched_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapReconciliation(dto: ReconciliationDto): ReconciliationRecord {
  return {
    id: dto.id,
    reconciliationType: dto.reconciliation_type,
    accountId: dto.account_id,
    statementStartDate: dto.statement_start_date,
    statementEndDate: dto.statement_end_date,
    statementBalance: dto.statement_balance,
    bookBalance: dto.book_balance,
    status: dto.status,
    closedBy: dto.closed_by ?? null,
    closedAt: dto.closed_at ?? null,
    account: dto.account ? mapAccountingAccount(dto.account) : null,
    items: (dto.items ?? []).map(mapReconciliationItem),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchPaymentMethods() {
  const response = await apiClient.get<ListDto<ReferenceDto>>("/api/finance/payment-methods");
  return (response.data.data ?? []).map(mapReference);
}

export async function createPaymentMethod(payload: CreatePaymentMethodPayload) {
  const response = await apiClient.post<SingleDto<ReferenceDto>>("/api/finance/payment-methods", payload);
  return mapReference(response.data.data);
}

export async function updatePaymentMethod(id: string, payload: UpdatePaymentMethodPayload) {
  const response = await apiClient.patch<SingleDto<ReferenceDto>>(`/api/finance/payment-methods/${id}`, payload);
  return mapReference(response.data.data);
}

export async function deletePaymentMethod(id: string) {
  await apiClient.delete(`/api/finance/payment-methods/${id}`);
}

export async function fetchTransactionTypes() {
  const response = await apiClient.get<ListDto<ReferenceDto>>("/api/finance/transaction-types");
  return (response.data.data ?? []).map(
    (item): TransactionTypeReference => ({
      id: item.id,
      name: item.name,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }),
  );
}

export async function createTransactionType(payload: CreateTransactionTypePayload) {
  const response = await apiClient.post<SingleDto<ReferenceDto>>("/api/finance/transaction-types", payload);
  return mapReference(response.data.data);
}

export async function updateTransactionType(id: string, payload: UpdateTransactionTypePayload) {
  const response = await apiClient.patch<SingleDto<ReferenceDto>>(`/api/finance/transaction-types/${id}`, payload);
  return mapReference(response.data.data);
}

export async function deleteTransactionType(id: string) {
  await apiClient.delete(`/api/finance/transaction-types/${id}`);
}

export async function fetchAccountingAccounts() {
  const response = await apiClient.get<ListDto<AccountingAccountDto>>("/api/finance/accounts");
  return (response.data.data ?? []).map(mapAccountingAccount);
}

export async function createAccountingAccount(payload: CreateAccountingAccountPayload) {
  const response = await apiClient.post<SingleDto<AccountingAccountDto>>("/api/finance/accounts", {
    code: payload.code,
    name: payload.name,
    accountType: payload.accountType,
    isActive: payload.isActive ?? true,
  });

  return mapAccountingAccount(response.data.data);
}

export async function updateAccountingAccount(id: string, payload: UpdateAccountingAccountPayload) {
  const response = await apiClient.patch<SingleDto<AccountingAccountDto>>(`/api/finance/accounts/${id}`, {
    code: payload.code || undefined,
    name: payload.name || undefined,
    accountType: payload.accountType || undefined,
    isActive: payload.isActive,
  });

  return mapAccountingAccount(response.data.data);
}

export async function deleteAccountingAccount(id: string) {
  await apiClient.delete(`/api/finance/accounts/${id}`);
}

export async function fetchFinanceTransactions(
  params: FinanceTransactionListParams,
): Promise<FinanceTransactionListResponse> {
  const response = await apiClient.get<ListDto<FinanceTransactionDto>>("/api/finance/transactions", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      transactionTypeId: params.transactionTypeId || undefined,
      paymentMethodId: params.paymentMethodId || undefined,
      sortBy: params.sortBy ?? "transactionDate",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapTransaction),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? params.page,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function createFinanceTransaction(payload: CreateFinanceTransactionPayload) {
  const response = await apiClient.post<SingleDto<FinanceTransactionDto>>("/api/finance/transactions", {
    transactionTypeId: payload.transactionTypeId,
    accountingCategory: payload.accountingCategory,
    amount: payload.amount,
    paymentMethodId: payload.paymentMethodId,
    referenceNumber: payload.referenceNumber || undefined,
    transactionDate: payload.transactionDate,
    description: payload.description || undefined,
  });

  return mapTransaction(response.data.data);
}

export async function updateFinanceTransaction(id: string, payload: UpdateFinanceTransactionPayload) {
  const response = await apiClient.patch<SingleDto<FinanceTransactionDto>>(`/api/finance/transactions/${id}`, {
    transactionTypeId: payload.transactionTypeId || undefined,
    accountingCategory: payload.accountingCategory || undefined,
    amount: payload.amount,
    paymentMethodId: payload.paymentMethodId || undefined,
    referenceNumber: payload.referenceNumber || undefined,
    transactionDate: payload.transactionDate || undefined,
    description: payload.description || undefined,
  });

  return mapTransaction(response.data.data);
}

export async function deleteFinanceTransaction(id: string) {
  await apiClient.delete(`/api/finance/transactions/${id}`);
}

export async function fetchJournalEntries(
  params: JournalEntryListParams,
): Promise<JournalEntryListResponse> {
  const response = await apiClient.get<ListDto<JournalEntryDto>>("/api/finance/journal-entries", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
      sortBy: params.sortBy ?? "entryDate",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapJournalEntry),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? params.page,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function createJournalEntry(payload: CreateJournalEntryPayload) {
  const response = await apiClient.post<SingleDto<JournalEntryDto>>("/api/finance/journal-entries", {
    entryNumber: payload.entryNumber,
    entryDate: payload.entryDate,
    description: payload.description || undefined,
    periodYear: payload.periodYear,
    periodMonth: payload.periodMonth,
    status: payload.status || "draft",
    lines: payload.lines.map((line) => ({
      accountId: line.accountId,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      description: line.description || undefined,
      paySlipId: line.paySlipId || undefined,
      referenceNumber: line.referenceNumber || undefined,
    })),
  });

  return mapJournalEntry(response.data.data);
}

export async function postJournalEntry(id: string) {
  const response = await apiClient.post<SingleDto<JournalEntryDto>>(`/api/finance/journal-entries/${id}/post`, {});
  return mapJournalEntry(response.data.data);
}

export async function fetchReconciliations(
  params: ReconciliationListParams,
): Promise<ReconciliationListResponse> {
  const response = await apiClient.get<ListDto<ReconciliationDto>>("/api/finance/reconciliations", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status || undefined,
      accountId: params.accountId || undefined,
      reconciliationType: params.reconciliationType || undefined,
      sortBy: params.sortBy ?? "statementEndDate",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapReconciliation),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? params.page,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function createReconciliation(payload: CreateReconciliationPayload) {
  const response = await apiClient.post<SingleDto<ReconciliationDto>>("/api/finance/reconciliations", {
    reconciliationType: payload.reconciliationType,
    accountId: payload.accountId,
    statementStartDate: payload.statementStartDate,
    statementEndDate: payload.statementEndDate,
    statementBalance: payload.statementBalance,
    bookBalance: payload.bookBalance,
    status: payload.status || "open",
  });

  return mapReconciliation(response.data.data);
}

export async function closeReconciliation(id: string) {
  const response = await apiClient.post<SingleDto<ReconciliationDto>>(`/api/finance/reconciliations/${id}/close`, {});
  return mapReconciliation(response.data.data);
}

export async function addReconciliationItem(
  reconciliationId: string,
  payload: CreateReconciliationItemPayload,
) {
  const response = await apiClient.post<SingleDto<ReconciliationItemDto>>(
    `/api/finance/reconciliations/${reconciliationId}/items`,
    {
      transactionId: payload.transactionId || undefined,
      journalEntryLineId: payload.journalEntryLineId || undefined,
    },
  );

  return mapReconciliationItem(response.data.data);
}
