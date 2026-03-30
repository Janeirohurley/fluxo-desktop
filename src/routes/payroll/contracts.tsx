import { createFileRoute } from "@tanstack/react-router";
import { PayrollContractsPage } from "@/modules/payroll/pages/PayrollContractsPage";

export const Route = createFileRoute("/payroll/contracts")({
  component: PayrollContractsPage,
});
