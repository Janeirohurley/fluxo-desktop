import { apiClient } from "@/shared/api/client";
import {
  type CreatePayrollJournalEntryPayload,
  type CreatePayrollPaySlipPayload,
  type GeneratePayrollPayRunPayload,
  type GeneratePayrollPayRunResult,
  type MarkPayrollPaySlipPaidPayload,
  type PayrollContractsListParams,
  type PayrollContract,
  type PayrollContractsResponse,
  type PayrollEmployeeSummary,
  type PayrollJournalEntryLinkResult,
  type PayrollLinkedJournalEntry,
  type PayrollLinkedTransaction,
  type PayrollOverview,
  type PayrollPaymentRegistrationResult,
  type PayrollPaySlip,
  type PayrollPaySlipLine,
  type PayrollPaySlipsListParams,
  type PayrollPaySlipsResponse,
  type RegisterPayrollPaymentPayload,
  type UpdatePayrollPaySlipPayload,
} from "@/modules/payroll/types/payroll.types";

type PayrollEmployeeSummaryDto = {
  id: string;
  employee_number: string;
  full_name: string;
  email?: string | null;
  status: string;
};

type PayrollContractDto = {
  id: string;
  employee_id: string;
  employee: PayrollEmployeeSummaryDto;
  contract_type: string;
  status: string;
  start_date: string;
  end_date?: string | null;
  salary_amount: number;
  currency: string;
  payment_frequency: string;
  created_at: string;
  updated_at: string;
};

type PayrollPaySlipLineDto = {
  id: string;
  pay_slip_id: string;
  line_type: string;
  label: string;
  amount: number;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

type PayrollPaySlipDto = {
  id: string;
  employee_id: string;
  contract_id: string;
  employee: PayrollEmployeeSummaryDto;
  contract: PayrollContractDto;
  pay_period_start: string;
  pay_period_end: string;
  payment_date?: string | null;
  issued_at?: string | null;
  gross_amount: number;
  total_deductions: number;
  net_amount: number;
  currency: string;
  status: string;
  notes?: string | null;
  lines: PayrollPaySlipLineDto[];
  linked_transactions_count: number;
  linked_journal_lines_count: number;
  linked_transactions?: PayrollLinkedTransactionDto[];
  linked_journal_entries?: PayrollLinkedJournalEntryDto[];
  created_at: string;
  updated_at: string;
};

type PayrollLinkedTransactionDto = {
  id: string;
  amount: number;
  transaction_date: string;
  accounting_category: string;
  reference_number?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

type PayrollLinkedJournalEntryDto = {
  id: string;
  entry_number: string;
  entry_date: string;
  status: string;
  posted_at?: string | null;
  created_at: string;
  updated_at: string;
};

type PayrollOverviewDto = {
  module: "payroll";
  description: string;
  ready: boolean;
  boundaries: string[];
  kpis: {
    active_contracts: number;
    total_pay_slips: number;
    draft_pay_slips: number;
    issued_pay_slips: number;
    paid_pay_slips: number;
    cancelled_pay_slips: number;
    gross_amount_total: number;
    net_amount_total: number;
  };
  recent_pay_slips: PayrollPaySlipDto[];
};

type PayrollPayRunGenerationSkippedItemDto = {
  contract_id: string;
  employee_id: string;
  employee_name: string;
  reason: string;
};

type PayrollPayRunGenerationResultDto = {
  pay_period_start: string;
  pay_period_end: string;
  payment_date?: string | null;
  created_count: number;
  skipped_count: number;
  created: PayrollPaySlipDto[];
  skipped: PayrollPayRunGenerationSkippedItemDto[];
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
  message?: string;
};

function mapEmployeeSummary(dto: PayrollEmployeeSummaryDto): PayrollEmployeeSummary {
  return {
    id: dto.id,
    employeeNumber: dto.employee_number,
    fullName: dto.full_name,
    email: dto.email ?? null,
    status: dto.status,
  };
}

function mapPayrollContract(dto: PayrollContractDto): PayrollContract {
  return {
    id: dto.id,
    employeeId: dto.employee_id,
    employee: mapEmployeeSummary(dto.employee),
    contractType: dto.contract_type,
    status: dto.status,
    startDate: dto.start_date,
    endDate: dto.end_date ?? null,
    salaryAmount: dto.salary_amount,
    currency: dto.currency,
    paymentFrequency: dto.payment_frequency,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapPaySlipLine(dto: PayrollPaySlipLineDto): PayrollPaySlipLine {
  return {
    id: dto.id,
    paySlipId: dto.pay_slip_id,
    lineType: dto.line_type,
    label: dto.label,
    amount: dto.amount,
    description: dto.description ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapLinkedTransaction(dto: PayrollLinkedTransactionDto): PayrollLinkedTransaction {
  return {
    id: dto.id,
    amount: dto.amount,
    transactionDate: dto.transaction_date,
    accountingCategory: dto.accounting_category,
    referenceNumber: dto.reference_number ?? null,
    description: dto.description ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapLinkedJournalEntry(dto: PayrollLinkedJournalEntryDto): PayrollLinkedJournalEntry {
  return {
    id: dto.id,
    entryNumber: dto.entry_number,
    entryDate: dto.entry_date,
    status: dto.status,
    postedAt: dto.posted_at ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapPaySlip(dto: PayrollPaySlipDto): PayrollPaySlip {
  return {
    id: dto.id,
    employeeId: dto.employee_id,
    contractId: dto.contract_id,
    employee: mapEmployeeSummary(dto.employee),
    contract: mapPayrollContract(dto.contract),
    payPeriodStart: dto.pay_period_start,
    payPeriodEnd: dto.pay_period_end,
    paymentDate: dto.payment_date ?? null,
    issuedAt: dto.issued_at ?? null,
    grossAmount: dto.gross_amount,
    totalDeductions: dto.total_deductions,
    netAmount: dto.net_amount,
    currency: dto.currency,
    status: dto.status,
    notes: dto.notes ?? null,
    lines: (dto.lines ?? []).map(mapPaySlipLine),
    linkedTransactionsCount: dto.linked_transactions_count,
    linkedJournalLinesCount: dto.linked_journal_lines_count,
    linkedTransactions: (dto.linked_transactions ?? []).map(mapLinkedTransaction),
    linkedJournalEntries: (dto.linked_journal_entries ?? []).map(mapLinkedJournalEntry),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapContractsResponse(response: ListDto<PayrollContractDto>): PayrollContractsResponse {
  return {
    results: (response.data ?? []).map(mapPayrollContract),
    count: response.pagination?.count ?? 0,
    next: response.pagination?.next ?? null,
    previous: response.pagination?.previous ?? null,
    current_page: response.pagination?.current_page ?? 1,
    total_pages: response.pagination?.total_pages ?? 1,
  };
}

function mapPaySlipsResponse(response: ListDto<PayrollPaySlipDto>): PayrollPaySlipsResponse {
  return {
    results: (response.data ?? []).map(mapPaySlip),
    count: response.pagination?.count ?? 0,
    next: response.pagination?.next ?? null,
    previous: response.pagination?.previous ?? null,
    current_page: response.pagination?.current_page ?? 1,
    total_pages: response.pagination?.total_pages ?? 1,
  };
}

export async function fetchPayrollOverview(): Promise<PayrollOverview> {
  const response = await apiClient.get<PayrollOverviewDto>("/api/payroll");

  return {
    module: response.data.module,
    description: response.data.description,
    ready: response.data.ready,
    boundaries: response.data.boundaries ?? [],
    kpis: {
      activeContracts: response.data.kpis.active_contracts,
      totalPaySlips: response.data.kpis.total_pay_slips,
      draftPaySlips: response.data.kpis.draft_pay_slips,
      issuedPaySlips: response.data.kpis.issued_pay_slips,
      paidPaySlips: response.data.kpis.paid_pay_slips,
      cancelledPaySlips: response.data.kpis.cancelled_pay_slips,
      grossAmountTotal: response.data.kpis.gross_amount_total,
      netAmountTotal: response.data.kpis.net_amount_total,
    },
    recentPaySlips: (response.data.recent_pay_slips ?? []).map(mapPaySlip),
  };
}

export async function fetchPayrollContracts(params: PayrollContractsListParams): Promise<PayrollContractsResponse> {
  const response = await apiClient.get<ListDto<PayrollContractDto>>("/api/payroll/contracts", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      employeeId: params.employeeId,
      paymentFrequency: params.paymentFrequency,
      sortBy: params.sortBy ?? "startDate",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return mapContractsResponse(response.data);
}

export async function fetchPayrollContractsByEmployee(employeeId: string): Promise<PayrollContractsResponse> {
  return fetchPayrollContracts({
    page: 1,
    pageSize: 50,
    employeeId,
    sortBy: "startDate",
    sortOrder: "desc",
  });
}

export async function fetchPaySlips(params: PayrollPaySlipsListParams): Promise<PayrollPaySlipsResponse> {
  const response = await apiClient.get<ListDto<PayrollPaySlipDto>>("/api/payroll/payslips", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      employeeId: params.employeeId,
      contractId: params.contractId,
      sortBy: params.sortBy ?? "payPeriodStart",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return mapPaySlipsResponse(response.data);
}

export async function fetchPaySlipsByEmployee(employeeId: string): Promise<PayrollPaySlipsResponse> {
  return fetchPaySlips({
    page: 1,
    pageSize: 50,
    employeeId,
    sortBy: "payPeriodStart",
    sortOrder: "desc",
  });
}

export async function fetchPayrollPaySlipById(paySlipId: string): Promise<PayrollPaySlip> {
  const response = await apiClient.get<SingleDto<PayrollPaySlipDto>>(`/api/payroll/payslips/${paySlipId}`);
  return mapPaySlip(response.data.data);
}

export async function createPayrollPaySlip(payload: CreatePayrollPaySlipPayload): Promise<PayrollPaySlip> {
  const response = await apiClient.post<SingleDto<PayrollPaySlipDto>>("/api/payroll/payslips", payload);
  return mapPaySlip(response.data.data);
}

export async function updatePayrollPaySlip(paySlipId: string, payload: UpdatePayrollPaySlipPayload): Promise<PayrollPaySlip> {
  const response = await apiClient.patch<SingleDto<PayrollPaySlipDto>>(`/api/payroll/payslips/${paySlipId}`, payload);
  return mapPaySlip(response.data.data);
}

export async function removePayrollPaySlip(paySlipId: string): Promise<void> {
  await apiClient.delete(`/api/payroll/payslips/${paySlipId}`);
}

export async function issuePayrollPaySlip(paySlipId: string): Promise<PayrollPaySlip> {
  const response = await apiClient.post<SingleDto<PayrollPaySlipDto>>(`/api/payroll/payslips/${paySlipId}/issue`);
  return mapPaySlip(response.data.data);
}

export async function markPayrollPaySlipPaid(
  paySlipId: string,
  payload: MarkPayrollPaySlipPaidPayload = {},
): Promise<PayrollPaySlip> {
  const response = await apiClient.post<SingleDto<PayrollPaySlipDto>>(`/api/payroll/payslips/${paySlipId}/mark-paid`, payload);
  return mapPaySlip(response.data.data);
}

export async function generatePayrollPayRun(payload: GeneratePayrollPayRunPayload): Promise<GeneratePayrollPayRunResult> {
  const response = await apiClient.post<SingleDto<PayrollPayRunGenerationResultDto>>("/api/payroll/payslips/generate", payload);
  return {
    payPeriodStart: response.data.data.pay_period_start,
    payPeriodEnd: response.data.data.pay_period_end,
    paymentDate: response.data.data.payment_date ?? null,
    createdCount: response.data.data.created_count,
    skippedCount: response.data.data.skipped_count,
    created: (response.data.data.created ?? []).map(mapPaySlip),
    skipped: (response.data.data.skipped ?? []).map((item) => ({
      contractId: item.contract_id,
      employeeId: item.employee_id,
      employeeName: item.employee_name,
      reason: item.reason,
    })),
  };
}

export async function createPayrollJournalEntry(
  paySlipId: string,
  payload: CreatePayrollJournalEntryPayload,
): Promise<PayrollJournalEntryLinkResult> {
  const response = await apiClient.post<
    SingleDto<{
      pay_slip: PayrollPaySlipDto;
      journal_entry: PayrollLinkedJournalEntryDto;
    }>
  >(`/api/payroll/payslips/${paySlipId}/journal-entry`, payload);

  return {
    paySlip: mapPaySlip(response.data.data.pay_slip),
    journalEntry: mapLinkedJournalEntry(response.data.data.journal_entry),
  };
}

export async function registerPayrollPayment(
  paySlipId: string,
  payload: RegisterPayrollPaymentPayload,
): Promise<PayrollPaymentRegistrationResult> {
  const response = await apiClient.post<
    SingleDto<{
      pay_slip: PayrollPaySlipDto;
      transaction: PayrollLinkedTransactionDto;
    }>
  >(`/api/payroll/payslips/${paySlipId}/register-payment`, payload);

  return {
    paySlip: mapPaySlip(response.data.data.pay_slip),
    transaction: mapLinkedTransaction(response.data.data.transaction),
  };
}
