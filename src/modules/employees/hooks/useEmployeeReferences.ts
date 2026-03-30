import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmployeeLocation,
  createEmployeePosition,
  createEmployeeRole,
  deleteEmployeeLocation,
  deleteEmployeePosition,
  deleteEmployeeRole,
  fetchEmployeeLocations,
  fetchEmployeePositions,
  fetchEmployeeRoles,
  updateEmployeeLocation,
  updateEmployeePosition,
  updateEmployeeRole,
} from "@/modules/employees/api/employees-references.api";
import {
  type CreateEmployeeReferencePayload,
  type UpdateEmployeeReferencePayload,
} from "@/modules/employees/types/employees.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const employeeReferencesQueryKeys = {
  roles: ["employees", "references", "roles"] as const,
  positions: ["employees", "references", "positions"] as const,
  locations: ["employees", "references", "locations"] as const,
};

export function useEmployeeRolesReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: employeeReferencesQueryKeys.roles,
    queryFn: fetchEmployeeRoles,
    enabled: Boolean(accessKey),
  });
}

export function useEmployeePositionsReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: employeeReferencesQueryKeys.positions,
    queryFn: fetchEmployeePositions,
    enabled: Boolean(accessKey),
  });
}

export function useEmployeeLocationsReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: employeeReferencesQueryKeys.locations,
    queryFn: fetchEmployeeLocations,
    enabled: Boolean(accessKey),
  });
}

export function useCreateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeReferencePayload) => createEmployeeRole(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.roles });
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeReferencePayload }) =>
      updateEmployeeRole(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.roles });
    },
  });
}

export function useDeleteEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeRole(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.roles });
    },
  });
}

export function useCreateEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeReferencePayload) => createEmployeePosition(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.positions });
    },
  });
}

export function useUpdateEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeReferencePayload }) =>
      updateEmployeePosition(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.positions });
    },
  });
}

export function useDeleteEmployeePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeePosition(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.positions });
    },
  });
}

export function useCreateEmployeeLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeReferencePayload) => createEmployeeLocation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.locations });
    },
  });
}

export function useUpdateEmployeeLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeReferencePayload }) =>
      updateEmployeeLocation(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.locations });
    },
  });
}

export function useDeleteEmployeeLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployeeLocation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeReferencesQueryKeys.locations });
    },
  });
}
