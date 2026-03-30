import { createFileRoute } from "@tanstack/react-router";
import { EmployeeReferencesPage } from "@/modules/employees/pages/EmployeeReferencesPage";

export const Route = createFileRoute("/employees/references")({
  component: EmployeeReferencesPage,
});
