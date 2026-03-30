import { createFileRoute } from "@tanstack/react-router";
import { FinanceJournalEntriesPage } from "@/modules/finance/pages/FinanceJournalEntriesPage";

export const Route = createFileRoute("/finance/journal-entries")({
  component: FinanceJournalEntriesPage,
});
