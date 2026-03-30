import { createFileRoute } from "@tanstack/react-router";
import { FinanceReferencesPage } from "@/modules/finance/pages/FinanceReferencesPage";

export const Route = createFileRoute("/finance/references")({
  component: FinanceReferencesPage,
});
