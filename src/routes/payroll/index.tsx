import { createFileRoute } from "@tanstack/react-router";
import { PayrollPage } from "@/modules/payroll/pages/PayrollPage";

export const Route = createFileRoute("/payroll/")({
  component: PayrollPage,
});
