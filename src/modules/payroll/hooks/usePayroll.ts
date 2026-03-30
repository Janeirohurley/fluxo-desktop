import { useQuery } from "@tanstack/react-query";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";
import { fetchPayrollContractsByEmployee, fetchPaySlipsByEmployee } from "@/modules/payroll/api/payroll.api";

export const payrollQueryKeys = {
  contractsByEmployee: (employeeId: string) => ["payroll", "contracts", "employee", employeeId] as const,
  payslipsByEmployee: (employeeId: string) => ["payroll", "payslips", "employee", employeeId] as const,
};

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
