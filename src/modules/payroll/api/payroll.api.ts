import { apiClient } from "@/shared/api/client";
import {
  type PayrollContract,
  type PayrollContractsResponse,
  type PayrollEmployeeSummary,
  type PayrollPaySlip,
  type PayrollPaySlipLine,
  type PayrollPaySlipsResponse,
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
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchPayrollContractsByEmployee(employeeId: string): Promise<PayrollContractsResponse> {
  const response = await apiClient.get<ListDto<PayrollContractDto>>("/api/payroll/contracts", {
    params: {
      page: 1,
      pageSize: 50,
      employeeId,
      sortBy: "startDate",
      sortOrder: "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapPayrollContract),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? 1,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function fetchPaySlipsByEmployee(employeeId: string): Promise<PayrollPaySlipsResponse> {
  const response = await apiClient.get<ListDto<PayrollPaySlipDto>>("/api/payroll/payslips", {
    params: {
      page: 1,
      pageSize: 50,
      employeeId,
      sortBy: "payPeriodStart",
      sortOrder: "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapPaySlip),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? 1,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}
