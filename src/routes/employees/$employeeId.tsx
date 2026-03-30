import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailPage } from "@/modules/employees/pages/EmployeeDetailPage";

export const Route = createFileRoute("/employees/$employeeId")({
  component: EmployeeDetailRoute,
});

function EmployeeDetailRoute() {
  const { employeeId } = Route.useParams();
  return <EmployeeDetailPage employeeId={employeeId} />;
}
