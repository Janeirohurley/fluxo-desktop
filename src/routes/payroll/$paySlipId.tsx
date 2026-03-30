import { createFileRoute } from "@tanstack/react-router";
import { PayrollPaySlipDetailPage } from "@/modules/payroll/pages/PayrollPaySlipDetailPage";

export const Route = createFileRoute("/payroll/$paySlipId")({
  component: PayrollPaySlipRoute,
});

function PayrollPaySlipRoute() {
  const { paySlipId } = Route.useParams();
  return <PayrollPaySlipDetailPage paySlipId={paySlipId} />;
}
