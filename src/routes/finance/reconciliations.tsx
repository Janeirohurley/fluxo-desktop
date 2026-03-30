import { createFileRoute } from "@tanstack/react-router";
import { FinanceReconciliationsPage } from "@/modules/finance/pages/FinanceReconciliationsPage";

export const Route = createFileRoute("/finance/reconciliations")({
  component: FinanceReconciliationsPage,
});
