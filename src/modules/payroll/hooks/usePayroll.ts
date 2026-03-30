import { useQuery } from "@tanstack/react-query";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import {
  fetchPayrollContracts,
  fetchPayrollContractsByEmployee,
  fetchPayrollOverview,
  fetchPayrollPaySlipById,
  fetchPaySlips,
  fetchPaySlipsByEmployee,
} from "@/modules/payroll/api/payroll.api";
import { type PayrollContractsListParams, type PayrollPaySlipsListParams } from "@/modules/payroll/types/payroll.types";

export const payrollQueryKeys = {
  root: ["payroll"] as const,
  overview: ["payroll", "overview"] as const,
  paySlipDetail: (paySlipId: string) => ["payroll", "payslip", paySlipId] as const,
  contracts: (params: PayrollContractsListParams) => ["payroll", "contracts", params] as const,
  payslips: (params: PayrollPaySlipsListParams) => ["payroll", "payslips", params] as const,
  contractsByEmployee: (employeeId: string) => ["payroll", "contracts", "employee", employeeId] as const,
  payslipsByEmployee: (employeeId: string) => ["payroll", "payslips", "employee", employeeId] as const,
};

export function usePayrollOverview(enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.overview,
    queryFn: fetchPayrollOverview,
    enabled: Boolean(accessKey && enabled),
  });
}

export function usePayrollContracts(params: PayrollContractsListParams, enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.contracts(params),
    queryFn: () => fetchPayrollContracts(params),
    enabled: Boolean(accessKey && enabled),
  });
}

export function usePayrollPaySlipDetail(paySlipId: string, enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.paySlipDetail(paySlipId),
    queryFn: () => fetchPayrollPaySlipById(paySlipId),
    enabled: Boolean(accessKey && paySlipId && enabled),
  });
}

export function usePayrollPaySlips(params: PayrollPaySlipsListParams, enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.payslips(params),
    queryFn: () => fetchPaySlips(params),
    enabled: Boolean(accessKey && enabled),
  });
}

export function usePayrollContractsByEmployee(employeeId: string, enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.contractsByEmployee(employeeId),
    queryFn: () => fetchPayrollContractsByEmployee(employeeId),
    enabled: Boolean(accessKey && employeeId && enabled),
  });
}

export function usePaySlipsByEmployee(employeeId: string, enabled = true) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: payrollQueryKeys.payslipsByEmployee(employeeId),
    queryFn: () => fetchPaySlipsByEmployee(employeeId),
    enabled: Boolean(accessKey && employeeId && enabled),
  });
}
