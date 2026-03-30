import { apiClient } from "@/shared/api/client";
import {
  type CreateEmployeeAssignmentPayload,
  type CreateEmployeeContractPayload,
  type CreateEmployeePayload,
  type EmployeeAssignment,
  type EmployeeContract,
  type EmployeeDetail,
  type EmployeeListParams,
  type EmployeeListResponse,
  type EmployeeRecord,
  type EmployeeReference,
  type UpdateEmployeeAssignmentPayload,
  type UpdateEmployeeContractPayload,
  type UpdateEmployeePayload,
} from "@/modules/employees/types/employees.types";

type EmployeeReferenceDto = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type EmployeeAssignmentDto = {
  id: string;
  employee_id: string;
  role_id: string;
  position_id: string;
  location_id: string;
  start_date: string;
  end_date?: string | null;
  role: EmployeeReferenceDto;
  position: EmployeeReferenceDto;
  location: EmployeeReferenceDto;
  created_at: string;
  updated_at: string;
};

type EmployeeContractDto = {
  id: string;
  employee_id: string;
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

type EmployeeRecordDto = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  hire_date: string;
  status: string;
  current_assignment?: EmployeeAssignmentDto | null;
  active_contract?: EmployeeContractDto | null;
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

function mapReference(dto: EmployeeReferenceDto): EmployeeReference {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapAssignment(dto: EmployeeAssignmentDto): EmployeeAssignment {
  return {
    id: dto.id,
    employeeId: dto.employee_id,
    roleId: dto.role_id,
    positionId: dto.position_id,
    locationId: dto.location_id,
    startDate: dto.start_date,
    endDate: dto.end_date ?? null,
    role: mapReference(dto.role),
    position: mapReference(dto.position),
    location: mapReference(dto.location),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapContract(dto: EmployeeContractDto): EmployeeContract {
  return {
    id: dto.id,
    employeeId: dto.employee_id,
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

function mapEmployee(dto: EmployeeRecordDto): EmployeeRecord {
  return {
    id: dto.id,
    employeeNumber: dto.employee_number,
    firstName: dto.first_name,
    lastName: dto.last_name,
    fullName: dto.full_name,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    hireDate: dto.hire_date,
    status: dto.status,
    currentAssignment: dto.current_assignment ? mapAssignment(dto.current_assignment) : null,
    activeContract: dto.active_contract ? mapContract(dto.active_contract) : null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchEmployees(params: EmployeeListParams): Promise<EmployeeListResponse> {
  const response = await apiClient.get<ListDto<EmployeeRecordDto>>("/api/employees", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      roleId: params.roleId || undefined,
      positionId: params.positionId || undefined,
      locationId: params.locationId || undefined,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapEmployee),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? params.page,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function fetchEmployeeById(id: string) {
  const response = await apiClient.get<SingleDto<EmployeeRecordDto>>(`/api/employees/${id}`);
  return mapEmployee(response.data.data);
}

export async function fetchEmployeeAssignments(employeeId: string) {
  const response = await apiClient.get<ListDto<EmployeeAssignmentDto>>(`/api/employees/${employeeId}/assignments`);
  return (response.data.data ?? []).map(mapAssignment);
}

export async function fetchEmployeeContracts(employeeId: string) {
  const response = await apiClient.get<ListDto<EmployeeContractDto>>(`/api/employees/${employeeId}/contracts`);
  return (response.data.data ?? []).map(mapContract);
}

export async function fetchEmployeeDetail(employeeId: string): Promise<EmployeeDetail> {
  const [employee, assignments, contracts] = await Promise.all([
    fetchEmployeeById(employeeId),
    fetchEmployeeAssignments(employeeId),
    fetchEmployeeContracts(employeeId),
  ]);

  return {
    employee,
    assignments,
    contracts,
  };
}

export async function createEmployee(payload: CreateEmployeePayload) {
  const response = await apiClient.post<SingleDto<EmployeeRecordDto>>("/api/employees", {
    employeeNumber: payload.employeeNumber,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email || undefined,
    phone: payload.phone || undefined,
    hireDate: payload.hireDate,
    status: payload.status || undefined,
  });

  return mapEmployee(response.data.data);
}

export async function updateEmployee(id: string, payload: UpdateEmployeePayload) {
  const response = await apiClient.patch<SingleDto<EmployeeRecordDto>>(`/api/employees/${id}`, {
    employeeNumber: payload.employeeNumber || undefined,
    firstName: payload.firstName || undefined,
    lastName: payload.lastName || undefined,
    email: payload.email || undefined,
    phone: payload.phone || undefined,
    hireDate: payload.hireDate || undefined,
    status: payload.status || undefined,
  });

  return mapEmployee(response.data.data);
}

export async function deleteEmployee(id: string) {
  await apiClient.delete(`/api/employees/${id}`);
}

export async function createEmployeeAssignment(employeeId: string, payload: CreateEmployeeAssignmentPayload) {
  const response = await apiClient.post<SingleDto<EmployeeAssignmentDto>>(`/api/employees/${employeeId}/assignments`, {
    roleId: payload.roleId,
    positionId: payload.positionId,
    locationId: payload.locationId,
    startDate: payload.startDate,
    endDate: payload.endDate || undefined,
  });

  return mapAssignment(response.data.data);
}

export async function updateEmployeeAssignment(
  employeeId: string,
  assignmentId: string,
  payload: UpdateEmployeeAssignmentPayload,
) {
  const response = await apiClient.patch<SingleDto<EmployeeAssignmentDto>>(
    `/api/employees/${employeeId}/assignments/${assignmentId}`,
    {
      roleId: payload.roleId || undefined,
      positionId: payload.positionId || undefined,
      locationId: payload.locationId || undefined,
      startDate: payload.startDate || undefined,
      endDate: payload.endDate || undefined,
    },
  );

  return mapAssignment(response.data.data);
}

export async function deleteEmployeeAssignment(employeeId: string, assignmentId: string) {
  await apiClient.delete(`/api/employees/${employeeId}/assignments/${assignmentId}`);
}

export async function createEmployeeContract(employeeId: string, payload: CreateEmployeeContractPayload) {
  const response = await apiClient.post<SingleDto<EmployeeContractDto>>(`/api/employees/${employeeId}/contracts`, {
    contractType: payload.contractType,
    status: payload.status || undefined,
    startDate: payload.startDate,
    endDate: payload.endDate || undefined,
    salaryAmount: payload.salaryAmount,
    currency: payload.currency || undefined,
    paymentFrequency: payload.paymentFrequency || undefined,
  });

  return mapContract(response.data.data);
}

export async function updateEmployeeContract(
  employeeId: string,
  contractId: string,
  payload: UpdateEmployeeContractPayload,
) {
  const response = await apiClient.patch<SingleDto<EmployeeContractDto>>(
    `/api/employees/${employeeId}/contracts/${contractId}`,
    {
      contractType: payload.contractType || undefined,
      status: payload.status || undefined,
      startDate: payload.startDate || undefined,
      endDate: payload.endDate || undefined,
      salaryAmount: payload.salaryAmount,
      currency: payload.currency || undefined,
      paymentFrequency: payload.paymentFrequency || undefined,
    },
  );

  return mapContract(response.data.data);
}

export async function deleteEmployeeContract(employeeId: string, contractId: string) {
  await apiClient.delete(`/api/employees/${employeeId}/contracts/${contractId}`);
}
