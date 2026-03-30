import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/modules/finance/pages/FinancePage";

export const Route = createFileRoute("/finance/")({
  component: FinancePage,
});
