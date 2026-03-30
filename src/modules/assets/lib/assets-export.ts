import {
  type AssetAssignment,
  type AssetRecord,
  type InterventionType,
  type LocationOption,
  type EmployeeOption,
  type MaintenanceLog,
} from "@/modules/assets/types/assets.types";

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const lines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...lines].join("\n");
}

export function exportAssetSnapshot(asset: AssetRecord) {
  const payload = {
    id: asset.id,
    inventoryCode: asset.inventoryCode,
    name: asset.name,
    category: asset.category?.name ?? null,
    status: asset.status?.name ?? null,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    financeData: asset.financeData,
    assignmentsCount: asset.assignments.length,
    maintenanceLogsCount: asset.maintenanceLogs.length,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    `asset-${asset.inventoryCode}-snapshot.json`,
    "application/json;charset=utf-8",
  );
}

export function exportAssetAssignments(
  asset: AssetRecord,
  employeeMap: Map<string, EmployeeOption>,
  locationMap: Map<string, LocationOption>,
) {
  const csv = buildCsv(
    ["Assignment ID", "Employee", "Employee Number", "Location", "Start Date", "End Date", "Created At"],
    asset.assignments.map((assignment: AssetAssignment) => {
      const employee = employeeMap.get(assignment.employeeId);
      const location = locationMap.get(assignment.locationId);

      return [
        assignment.id,
        employee?.fullName ?? assignment.employeeId,
        employee?.employeeNumber ?? "",
        location?.name ?? assignment.locationId,
        assignment.startDate,
        assignment.endDate ?? "",
        assignment.createdAt,
      ];
    }),
  );

  downloadFile(
    csv,
    `asset-${asset.inventoryCode}-assignments.csv`,
    "text/csv;charset=utf-8",
  );
}

export function exportAssetMaintenance(
  asset: AssetRecord,
  interventionTypeMap: Map<string, InterventionType>,
) {
  const csv = buildCsv(
    ["Maintenance ID", "Intervention Type", "Description", "Provider", "Cost", "Created At"],
    asset.maintenanceLogs.map((log: MaintenanceLog) => [
      log.id,
      interventionTypeMap.get(log.interventionTypeId)?.name ?? log.interventionTypeId,
      log.description ?? "",
      log.provider ?? "",
      log.interventionCost ?? "",
      log.createdAt,
    ]),
  );

  downloadFile(
    csv,
    `asset-${asset.inventoryCode}-maintenance.csv`,
    "text/csv;charset=utf-8",
  );
}
