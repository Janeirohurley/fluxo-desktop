import { type PaginatedResponse } from "@/shared/ui/DataTable";

export type PaymentMethodReference = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionTypeReference = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountingAccount = {
  id: string;
  code: string;
  name: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceTransactionRecord = {
  id: string;
  transactionTypeId: string;
  accountingCategory: string;
  amount: number;
  paymentMethodId: string;
  referenceNumber: string | null;
  transactionDate: string;
  description: string | null;
  employeeId: string | null;
  assetId: string | null;
  paySlipId: string | null;
  journalEntryId: string | null;
  paymentMethod: PaymentMethodReference | null;
  transactionType: TransactionTypeReference | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceTransactionListParams = {
  page: number;
  pageSize: number;
  search?: string;
  transactionTypeId?: string;
  paymentMethodId?: string;
  sortBy?: "transactionDate" | "amount" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type FinanceTransactionListResponse = PaginatedResponse<FinanceTransactionRecord>;

export type CreatePaymentMethodPayload = {
  name: string;
};

export type UpdatePaymentMethodPayload = Partial<CreatePaymentMethodPayload>;

export type CreateTransactionTypePayload = {
  name: string;
};

export type UpdateTransactionTypePayload = Partial<CreateTransactionTypePayload>;

export type CreateAccountingAccountPayload = {
  code: string;
  name: string;
  accountType: AccountingAccount["accountType"];
  isActive?: boolean;
};

export type UpdateAccountingAccountPayload = Partial<CreateAccountingAccountPayload>;

export type CreateFinanceTransactionPayload = {
  transactionTypeId: string;
  accountingCategory: string;
  amount: number;
  paymentMethodId: string;
  referenceNumber?: string;
  transactionDate: string;
  description?: string;
};

export type UpdateFinanceTransactionPayload = Partial<CreateFinanceTransactionPayload>;

export type JournalEntryLineRecord = {
  id: string;
  journalEntryId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string | null;
  employeeId: string | null;
  assetId: string | null;
  paySlipId: string | null;
  referenceNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryRecord = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  periodYear: number;
  periodMonth: number;
  status: "draft" | "posted";
  postedBy: string | null;
  postedAt: string | null;
  lines: JournalEntryLineRecord[];
  createdAt: string;
  updatedAt: string;
};

export type JournalEntryListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: "draft" | "posted";
  periodYear?: number;
  periodMonth?: number;
  sortBy?: "entryDate" | "createdAt" | "updatedAt" | "entryNumber";
  sortOrder?: "asc" | "desc";
};

export type JournalEntryListResponse = PaginatedResponse<JournalEntryRecord>;

export type CreateJournalEntryLinePayload = {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  paySlipId?: string;
  referenceNumber?: string;
};

export type CreateJournalEntryPayload = {
  entryNumber: string;
  entryDate: string;
  description?: string;
  periodYear: number;
  periodMonth: number;
  status?: "draft" | "posted";
  lines: CreateJournalEntryLinePayload[];
};

export type ReconciliationItemRecord = {
  id: string;
  reconciliationId: string;
  transactionId: string | null;
  journalEntryLineId: string | null;
  matchedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationRecord = {
  id: string;
  reconciliationType: string;
  accountId: string;
  statementStartDate: string;
  statementEndDate: string;
  statementBalance: number;
  bookBalance: number;
  status: "open" | "closed";
  closedBy: string | null;
  closedAt: string | null;
  account: AccountingAccount | null;
  items: ReconciliationItemRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ReconciliationListParams = {
  page: number;
  pageSize: number;
  status?: "open" | "closed";
  accountId?: string;
  reconciliationType?: string;
  sortBy?: "statementEndDate" | "statementStartDate" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
};

export type ReconciliationListResponse = PaginatedResponse<ReconciliationRecord>;

export type CreateReconciliationPayload = {
  reconciliationType: string;
  accountId: string;
  statementStartDate: string;
  statementEndDate: string;
  statementBalance: number;
  bookBalance: number;
  status?: "open" | "closed";
};

export type CreateReconciliationItemPayload = {
  transactionId?: string;
  journalEntryLineId?: string;
};
