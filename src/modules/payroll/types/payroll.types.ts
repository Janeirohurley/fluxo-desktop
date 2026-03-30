import { type PaginatedResponse } from "@/shared/ui/DataTable";

export type PayrollEmployeeSummary = {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string | null;
  status: string;
};

export type PayrollContract = {
  id: string;
  employeeId: string;
  employee: PayrollEmployeeSummary;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  salaryAmount: number;
  currency: string;
  paymentFrequency: string;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPaySlipLine = {
  id: string;
  paySlipId: string;
  lineType: string;
  label: string;
  amount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollPaySlip = {
  id: string;
  employeeId: string;
  contractId: string;
  employee: PayrollEmployeeSummary;
  contract: PayrollContract;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string | null;
  issuedAt: string | null;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  currency: string;
  status: string;
  notes: string | null;
  lines: PayrollPaySlipLine[];
  linkedTransactionsCount: number;
  linkedJournalLinesCount: number;
  linkedTransactions?: PayrollLinkedTransaction[];
  linkedJournalEntries?: PayrollLinkedJournalEntry[];
  createdAt: string;
  updatedAt: string;
};

export type PayrollLinkedTransaction = {
  id: string;
  amount: number;
  transactionDate: string;
  accountingCategory: string;
  referenceNumber: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollLinkedJournalEntry = {
  id: string;
  entryNumber: string;
  entryDate: string;
  status: string;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayrollOverview = {
  module: "payroll";
  description: string;
  ready: boolean;
  boundaries: string[];
  kpis: {
    activeContracts: number;
    totalPaySlips: number;
    draftPaySlips: number;
    issuedPaySlips: number;
    paidPaySlips: number;
    cancelledPaySlips: number;
    grossAmountTotal: number;
    netAmountTotal: number;
  };
  recentPaySlips: PayrollPaySlip[];
};

export type PayrollContractsResponse = PaginatedResponse<PayrollContract>;
export type PayrollPaySlipsResponse = PaginatedResponse<PayrollPaySlip>;

export type PayrollContractsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  employeeId?: string;
  paymentFrequency?: string;
  sortBy?: "createdAt" | "updatedAt" | "startDate" | "endDate" | "salaryAmount";
  sortOrder?: "asc" | "desc";
};

export type PayrollPaySlipsListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: "draft" | "issued" | "paid" | "cancelled";
  employeeId?: string;
  contractId?: string;
  sortBy?: "createdAt" | "updatedAt" | "payPeriodStart" | "payPeriodEnd" | "grossAmount" | "netAmount";
  sortOrder?: "asc" | "desc";
};

export type CreatePayrollPaySlipLinePayload = {
  lineType: "earning" | "deduction" | "tax" | "benefit";
  label: string;
  amount: number;
  description?: string;
};

export type CreatePayrollPaySlipPayload = {
  employeeId: string;
  contractId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate?: string;
  currency?: string;
  notes?: string;
  lines: CreatePayrollPaySlipLinePayload[];
};

export type UpdatePayrollPaySlipPayload = Partial<
  Pick<CreatePayrollPaySlipPayload, "payPeriodStart" | "payPeriodEnd" | "paymentDate" | "currency" | "notes" | "lines">
>;

export type GeneratePayrollPayRunPayload = {
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate?: string;
  contractIds?: string[];
  earningLabel?: string;
  notes?: string;
  skipExisting?: boolean;
};

export type GeneratePayrollPayRunResult = {
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string | null;
  createdCount: number;
  skippedCount: number;
  created: PayrollPaySlip[];
  skipped: Array<{
    contractId: string;
    employeeId: string;
    employeeName: string;
    reason: string;
  }>;
};

export type MarkPayrollPaySlipPaidPayload = {
  paymentDate?: string;
};

export type CreatePayrollJournalEntryPayload = {
  expenseAccountId: string;
  payrollPayableAccountId: string;
  deductionsPayableAccountId?: string;
  entryDate?: string;
  entryNumber?: string;
  description?: string;
  status?: "draft" | "posted";
  postedBy?: string;
};

export type RegisterPayrollPaymentPayload = {
  transactionTypeId: string;
  paymentMethodId: string;
  transactionDate?: string;
  referenceNumber?: string;
  description?: string;
  markAsPaid?: boolean;
};

export type PayrollJournalEntryLinkResult = {
  paySlip: PayrollPaySlip;
  journalEntry: PayrollLinkedJournalEntry;
};

export type PayrollPaymentRegistrationResult = {
  paySlip: PayrollPaySlip;
  transaction: PayrollLinkedTransaction;
};
