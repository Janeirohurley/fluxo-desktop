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
  createdAt: string;
  updatedAt: string;
};

export type PayrollContractsResponse = PaginatedResponse<PayrollContract>;
export type PayrollPaySlipsResponse = PaginatedResponse<PayrollPaySlip>;
