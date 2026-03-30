import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { notify } from "@/shared/lib/toast";
import { Badge, Button, Card, Field } from "@/shared/ui";
import DataTable, { type DataTableColumn } from "@/shared/ui/DataTable";

type ReferenceRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type ReferenceSectionKey = "roles" | "positions" | "locations";

type ReferenceTableSectionProps<T extends ReferenceRecord> = {
  sectionKey: ReferenceSectionKey;
  tableId: string;
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<unknown>;
  onDelete: (row: T) => Promise<unknown>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: { message?: string } } }).response?.data?.message
  ) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback;
  }

  return fallback;
}

export function ReferenceTableSection<T extends ReferenceRecord>({
  sectionKey,
  tableId,
  data,
  isLoading = false,
  error = null,
  onCreate,
  onUpdate,
  onDelete,
}: ReferenceTableSectionProps<T>) {
  const { t } = useTranslation("employees");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return data;
    }

    return data.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
  }, [data, search]);

  const columns: DataTableColumn<T>[] = [
    {
      key: "name",
      label: t("references.table.name"),
      sortable: true,
      editable: true,
      searchable: true,
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>,
    },
    {
      key: "createdAt",
      label: t("references.table.createdAt"),
      sortable: true,
      editable: false,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "updatedAt",
      label: t("references.table.updatedAt"),
      sortable: true,
      editable: false,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  const handleCreate = async () => {
    const name = createName.trim();

    if (!name) {
      notify.error(t(`references.sections.${sectionKey}.createValidationError`));
      return;
    }

    setIsSubmittingCreate(true);

    try {
      await onCreate(name);
      notify.success(t(`references.sections.${sectionKey}.createSuccess`));
      setCreateName("");
      setIsCreateOpen(false);
    } catch (error) {
      notify.error(resolveErrorMessage(error, t(`references.sections.${sectionKey}.createError`)));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdate = async (rowId: string | number, _columnKey: string, newValue: string) => {
    const name = newValue.trim();

    if (!name) {
      notify.error(t(`references.sections.${sectionKey}.updateValidationError`));
      throw new Error("Empty reference name");
    }

    try {
      await onUpdate(String(rowId), name);
      notify.success(t(`references.sections.${sectionKey}.updateSuccess`));
    } catch (error) {
      notify.error(resolveErrorMessage(error, t(`references.sections.${sectionKey}.updateError`)));
      throw error;
    }
  };

  const handleDelete = async (row: T) => {
    try {
      await onDelete(row);
      notify.success(t(`references.sections.${sectionKey}.deleteSuccess`));
    } catch (error) {
      notify.error(resolveErrorMessage(error, t(`references.sections.${sectionKey}.deleteError`)));
    }
  };

  return (
    <Card className="grid gap-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {t(`references.sections.${sectionKey}.title`)}
            </h2>
            <Badge tone="outline">{data.length}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t(`references.sections.${sectionKey}.description`)}
          </p>
        </div>
      </div>

      <DataTable<T>
        tableId={tableId}
        data={filteredData}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onSearchChange={(value) => {
          setCurrentPage(1);
          setSearch(value);
        }}
        isLoading={isLoading}
        error={error}
        onAddRow={() => {
          setCreateName("");
          setIsCreateOpen(true);
        }}
        onCellEdit={handleUpdate}
        onDeleteRow={(row) => {
          void handleDelete(row);
        }}
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t(`references.sections.${sectionKey}.createTitle`)}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(`references.sections.${sectionKey}.createDescription`)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <Field
                label={t("references.form.name")}
                placeholder={t(`references.sections.${sectionKey}.namePlaceholder`)}
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                {t("references.form.cancel")}
              </Button>
              <Button
                onClick={() => void handleCreate()}
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={isSubmittingCreate}
              >
                {isSubmittingCreate ? t("references.form.submitting") : t("references.form.submit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
