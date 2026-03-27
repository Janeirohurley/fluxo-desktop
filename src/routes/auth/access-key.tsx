import { createFileRoute } from "@tanstack/react-router";
import { AccessKeyPage } from "@/modules/auth/pages/AccessKeyPage";

export const Route = createFileRoute("/auth/access-key")({
  component: AccessKeyPage,
});
