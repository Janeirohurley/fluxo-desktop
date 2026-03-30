import { useQuery } from "@tanstack/react-query";
import {
  fetchEmployeeDetail,
  fetchEmployees,
} from "@/modules/employees/api/employees.api";
import { type EmployeeListParams } from "@/modules/employees/types/employees.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const employeesQueryKeys = {
  list: (params: EmployeeListParams) => ["employees", "list", params] as const,
  detail: (employeeId: string) => ["employees", "detail", employeeId] as const,
};

export function useEmployees(params: EmployeeListParams) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: employeesQueryKeys.list(params),
    queryFn: () => fetchEmployees(params),
    enabled: Boolean(accessKey),
  });
}

export function useEmployeeDetail(employeeId: string) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: employeesQueryKeys.detail(employeeId),
    queryFn: () => fetchEmployeeDetail(employeeId),
    enabled: Boolean(accessKey && employeeId),
  });
}
