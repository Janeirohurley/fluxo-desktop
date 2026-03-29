import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/modules/assets/pages/AssetsPage";

export const Route = createFileRoute("/assets/")({
  component: AssetsPage,
});
