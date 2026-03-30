import { createFileRoute } from "@tanstack/react-router";
import { AssetReferencesPage } from "@/modules/assets/pages/AssetReferencesPage";

export const Route = createFileRoute("/assets/references")({
  component: AssetReferencesPage,
});
