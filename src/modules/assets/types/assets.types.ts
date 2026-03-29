import { type PaginatedResponse } from "@/shared/ui/DataTable";

export type AssetCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetStatus = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetFinanceData = {
  assetId: string;
  acquisitionDate: string;
  purchaseValue: number;
  estimatedLifeYears: number;
  residualValue: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetAssignment = {
  id: string;
  assetId: string;
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceLog = {
  id: string;
  assetId: string;
  interventionTypeId: string;
  description: string | null;
  interventionCost: number | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  inventoryCode: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  categoryId: string;
  statusId: string;
  category: AssetCategory | null;
  status: AssetStatus | null;
  financeData: AssetFinanceData | null;
  assignments: AssetAssignment[];
  maintenanceLogs: MaintenanceLog[];
  createdAt: string;
  updatedAt: string;
};

export type AssetListParams = {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
  statusId?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "inventoryCode";
  sortOrder?: "asc" | "desc";
};

export type AssetListResponse = PaginatedResponse<AssetRecord>;
