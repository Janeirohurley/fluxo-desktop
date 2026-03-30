import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { AssetDetailPage } from "@/modules/assets/pages/AssetDetailPage";

const assetDetailRouteApi = getRouteApi("/assets/$assetId");

function AssetDetailRouteComponent() {
  const { assetId } = assetDetailRouteApi.useParams();

  return <AssetDetailPage assetId={assetId} />;
}

export const Route = createFileRoute("/assets/$assetId")({
  component: AssetDetailRouteComponent,
});
