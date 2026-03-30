import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/modules/employees/pages/EmployeesPage";

export const Route = createFileRoute("/employees/")({
  component: EmployeesPage,
});
