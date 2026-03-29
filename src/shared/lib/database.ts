/* eslint-disable @typescript-eslint/no-explicit-any */
import Dexie from 'dexie';

export interface TableSettings {
  id?: number;
  tableId: string;
  hiddenColumns: string[];
  pinnedColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
  pageSize: number;
  sortColumns: Array<{ column: string; direction: 'asc' | 'desc' }>;
  selectedRows: string[];
  updatedAt: Date;
}

export interface TableData {
  id?: number;
  tableId: string;
  rowId: string;
  data: any;
  originalIndex: number;
  customOrder?: number;
  updatedAt: Date;
}


export class DataTableDB extends Dexie {
  settings!: Dexie.Table<TableSettings, number>;
  tableData!: Dexie.Table<TableData, number>;

  constructor() {
    super('DataTableDB');
    this.version(2).stores({
      settings: '++id, tableId, updatedAt',
      tableData: '++id, [tableId+rowId], tableId, rowId, originalIndex, customOrder, updatedAt',
    });
  }
}

export const db = new DataTableDB();

// Fonctions utilitaires
export const saveTableSettings = async (tableId: string, settings: Partial<TableSettings>) => {
  const existing = await db.settings.where('tableId').equals(tableId).first();
  
  if (existing) {
    await db.settings.update(existing.id!, {
      ...settings,
      updatedAt: new Date()
    });
  } else {
    await db.settings.add({
      tableId,
      hiddenColumns: [],
      pinnedColumns: [],
      columnOrder: [],
      columnWidths: {},
      pageSize: 10,
      sortColumns: [],
      selectedRows: [],
      ...settings,
      updatedAt: new Date()
    });
  }
};

export const getTableSettings = async (tableId: string): Promise<TableSettings | null> => {
  return await db.settings.where('tableId').equals(tableId).first() || null;
};

export const saveTableData = async (tableId: string, data: any[], getRowId: (row: any) => string) => {
  // Supprimer les anciennes données
  await db.tableData.where('tableId').equals(tableId).delete();
  
  // Sauvegarder les nouvelles données avec leur index original
  const tableDataItems = data.map((row, index) => ({
    tableId,
    rowId: getRowId(row),
    data: row,
    originalIndex: index,
    updatedAt: new Date()
  }));
  
  await db.tableData.bulkAdd(tableDataItems);
};

export const getTableData = async (tableId: string): Promise<any[]> => {
  const items = await db.tableData.where('tableId').equals(tableId).toArray();
  return items
    .sort((a, b) => (a.customOrder ?? a.originalIndex) - (b.customOrder ?? b.originalIndex))
    .map(item => item.data);
};

export const updateRowOrder = async (tableId: string, newOrder: string[]) => {
  const items = await db.tableData.where('tableId').equals(tableId).toArray();

  for (let i = 0; i < newOrder.length; i++) {
    const item = items.find(item => item.rowId === newOrder[i]);
    if (item) {
      await db.tableData.update(item.id!, {
        customOrder: i,
        updatedAt: new Date()
      });
    }
  }
};
