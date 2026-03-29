import { apiClient } from "@/shared/api/client";
import { type AssetCategory, type AssetListParams, type AssetListResponse, type AssetRecord, type AssetStatus } from "@/modules/assets/types/assets.types";

type AssetCategoryDto = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type AssetStatusDto = AssetCategoryDto;

type AssetFinanceDataDto = {
  asset_id: string;
  acquisition_date: string;
  purchase_value: number;
  estimated_life_years: number;
  residual_value?: number | null;
  created_at: string;
  updated_at: string;
};

type AssetAssignmentDto = {
  id: string;
  asset_id: string;
  employee_id: string;
  location_id: string;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
};

type MaintenanceLogDto = {
  id: string;
  asset_id: string;
  intervention_type_id: string;
  description?: string | null;
  intervention_cost?: number | null;
  provider?: string | null;
  created_at: string;
  updated_at: string;
};

type AssetRecordDto = {
  id: string;
  inventory_code: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  category_id: string;
  status_id: string;
  category?: AssetCategoryDto | null;
  status?: AssetStatusDto | null;
  finance_data?: AssetFinanceDataDto | null;
  assignments?: AssetAssignmentDto[];
  maintenance_logs?: MaintenanceLogDto[];
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

type PaginatedAssetsDto = {
  data: AssetRecordDto[];
  pagination?: PaginationDto;
};

type ListReferenceDto<T> = {
  data: T[];
};

type SingleAssetDto = {
  data: AssetRecordDto;
};

type CreateAssetPayload = {
  inventoryCode: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  categoryId: string;
  statusId: string;
};

type UpdateAssetPayload = Partial<CreateAssetPayload>;

function mapCategory(dto: AssetCategoryDto): AssetCategory {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapStatus(dto: AssetStatusDto): AssetStatus {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function mapAsset(dto: AssetRecordDto): AssetRecord {
  return {
    id: dto.id,
    inventoryCode: dto.inventory_code,
    name: dto.name,
    brand: dto.brand ?? null,
    model: dto.model ?? null,
    serialNumber: dto.serial_number ?? null,
    categoryId: dto.category_id,
    statusId: dto.status_id,
    category: dto.category ? mapCategory(dto.category) : null,
    status: dto.status ? mapStatus(dto.status) : null,
    financeData: dto.finance_data
      ? {
          assetId: dto.finance_data.asset_id,
          acquisitionDate: dto.finance_data.acquisition_date,
          purchaseValue: dto.finance_data.purchase_value,
          estimatedLifeYears: dto.finance_data.estimated_life_years,
          residualValue: dto.finance_data.residual_value ?? null,
          createdAt: dto.finance_data.created_at,
          updatedAt: dto.finance_data.updated_at,
        }
      : null,
    assignments: (dto.assignments ?? []).map((assignment) => ({
      id: assignment.id,
      assetId: assignment.asset_id,
      employeeId: assignment.employee_id,
      locationId: assignment.location_id,
      startDate: assignment.start_date,
      endDate: assignment.end_date ?? null,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
    })),
    maintenanceLogs: (dto.maintenance_logs ?? []).map((log) => ({
      id: log.id,
      assetId: log.asset_id,
      interventionTypeId: log.intervention_type_id,
      description: log.description ?? null,
      interventionCost: log.intervention_cost ?? null,
      provider: log.provider ?? null,
      createdAt: log.created_at,
      updatedAt: log.updated_at,
    })),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchAssets(params: AssetListParams): Promise<AssetListResponse> {
  const response = await apiClient.get<PaginatedAssetsDto>("/api/assets", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      categoryId: params.categoryId || undefined,
      statusId: params.statusId || undefined,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    },
  });

  return {
    results: (response.data.data ?? []).map(mapAsset),
    count: response.data.pagination?.count ?? 0,
    next: response.data.pagination?.next ?? null,
    previous: response.data.pagination?.previous ?? null,
    current_page: response.data.pagination?.current_page ?? params.page,
    total_pages: response.data.pagination?.total_pages ?? 1,
  };
}

export async function fetchAssetCategories() {
  const response = await apiClient.get<ListReferenceDto<AssetCategoryDto>>("/api/assets/categories");
  return (response.data.data ?? []).map(mapCategory);
}

export async function fetchAssetStatuses() {
  const response = await apiClient.get<ListReferenceDto<AssetStatusDto>>("/api/assets/statuses");
  return (response.data.data ?? []).map(mapStatus);
}

export async function createAsset(payload: CreateAssetPayload) {
  const response = await apiClient.post<SingleAssetDto>("/api/assets", {
    inventoryCode: payload.inventoryCode,
    name: payload.name,
    brand: payload.brand || undefined,
    model: payload.model || undefined,
    serialNumber: payload.serialNumber || undefined,
    categoryId: payload.categoryId,
    statusId: payload.statusId,
  });

  return mapAsset(response.data.data);
}

export async function updateAsset(id: string, payload: UpdateAssetPayload) {
  const response = await apiClient.patch<SingleAssetDto>(`/api/assets/${id}`, {
    inventoryCode: payload.inventoryCode || undefined,
    name: payload.name || undefined,
    brand: payload.brand || undefined,
    model: payload.model || undefined,
    serialNumber: payload.serialNumber || undefined,
    categoryId: payload.categoryId || undefined,
    statusId: payload.statusId || undefined,
  });

  return mapAsset(response.data.data);
}

export async function deleteAsset(id: string) {
  await apiClient.delete(`/api/assets/${id}`);
}
