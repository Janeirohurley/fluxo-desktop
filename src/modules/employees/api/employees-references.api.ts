import { apiClient } from "@/shared/api/client";
import {
  type CreateEmployeeReferencePayload,
  type EmployeeLocationReference,
  type EmployeePositionReference,
  type EmployeeRoleReference,
  type UpdateEmployeeReferencePayload,
} from "@/modules/employees/types/employees.types";

type ReferenceDto = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type ListDto = {
  data: ReferenceDto[];
};

type SingleDto = {
  data: ReferenceDto;
};

function mapReference(dto: ReferenceDto) {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchEmployeeRoles(): Promise<EmployeeRoleReference[]> {
  const response = await apiClient.get<ListDto>("/api/employees/roles");
  return (response.data.data ?? []).map(mapReference);
}

export async function createEmployeeRole(payload: CreateEmployeeReferencePayload) {
  const response = await apiClient.post<SingleDto>("/api/employees/roles", payload);
  return mapReference(response.data.data);
}

export async function updateEmployeeRole(id: string, payload: UpdateEmployeeReferencePayload) {
  const response = await apiClient.patch<SingleDto>(`/api/employees/roles/${id}`, {
    name: payload.name,
  });
  return mapReference(response.data.data);
}

export async function deleteEmployeeRole(id: string) {
  await apiClient.delete(`/api/employees/roles/${id}`);
}

export async function fetchEmployeePositions(): Promise<EmployeePositionReference[]> {
  const response = await apiClient.get<ListDto>("/api/employees/positions");
  return (response.data.data ?? []).map(mapReference);
}

export async function createEmployeePosition(payload: CreateEmployeeReferencePayload) {
  const response = await apiClient.post<SingleDto>("/api/employees/positions", payload);
  return mapReference(response.data.data);
}

export async function updateEmployeePosition(id: string, payload: UpdateEmployeeReferencePayload) {
  const response = await apiClient.patch<SingleDto>(`/api/employees/positions/${id}`, {
    name: payload.name,
  });
  return mapReference(response.data.data);
}

export async function deleteEmployeePosition(id: string) {
  await apiClient.delete(`/api/employees/positions/${id}`);
}

export async function fetchEmployeeLocations(): Promise<EmployeeLocationReference[]> {
  const response = await apiClient.get<ListDto>("/api/employees/locations");
  return (response.data.data ?? []).map(mapReference);
}

export async function createEmployeeLocation(payload: CreateEmployeeReferencePayload) {
  const response = await apiClient.post<SingleDto>("/api/employees/locations", payload);
  return mapReference(response.data.data);
}

export async function updateEmployeeLocation(id: string, payload: UpdateEmployeeReferencePayload) {
  const response = await apiClient.patch<SingleDto>(`/api/employees/locations/${id}`, {
    name: payload.name,
  });
  return mapReference(response.data.data);
}

export async function deleteEmployeeLocation(id: string) {
  await apiClient.delete(`/api/employees/locations/${id}`);
}
