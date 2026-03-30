import { type PaginatedResponse } from "@/shared/ui/DataTable";

export type EmployeeReference = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeAssignment = {
  id: string;
  employeeId: string;
  roleId: string;
  positionId: string;
  locationId: string;
  startDate: string;
  endDate: string | null;
  role: EmployeeReference;
  position: EmployeeReference;
  location: EmployeeReference;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeContract = {
  id: string;
  employeeId: string;
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

export type EmployeeRecord = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  hireDate: string;
  status: string;
  currentAssignment: EmployeeAssignment | null;
  activeContract: EmployeeContract | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeDetail = {
  employee: EmployeeRecord;
  assignments: EmployeeAssignment[];
  contracts: EmployeeContract[];
};

export type EmployeeListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  roleId?: string;
  positionId?: string;
  locationId?: string;
  sortBy?: "createdAt" | "updatedAt" | "employeeNumber" | "firstName" | "lastName" | "hireDate";
  sortOrder?: "asc" | "desc";
};

export type EmployeeListResponse = PaginatedResponse<EmployeeRecord>;

export type CreateEmployeePayload = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  hireDate: string;
  status?: string;
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

export type CreateEmployeeAssignmentPayload = {
  roleId: string;
  positionId: string;
  locationId: string;
  startDate: string;
  endDate?: string;
};

export type UpdateEmployeeAssignmentPayload = Partial<CreateEmployeeAssignmentPayload>;

export type CreateEmployeeContractPayload = {
  contractType: string;
  status?: string;
  startDate: string;
  endDate?: string;
  salaryAmount: number;
  currency?: string;
  paymentFrequency?: string;
};

export type UpdateEmployeeContractPayload = Partial<CreateEmployeeContractPayload>;

export type EmployeeRoleReference = EmployeeReference;
export type EmployeePositionReference = EmployeeReference;
export type EmployeeLocationReference = EmployeeReference;

export type CreateEmployeeReferencePayload = {
  name: string;
};

export type UpdateEmployeeReferencePayload = Partial<CreateEmployeeReferencePayload>;
