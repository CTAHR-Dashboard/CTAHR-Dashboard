import EcosystemDashboard from "@/components/dashboard/EcosystemDashboard";

export default function Home() {
  return (
    <EcosystemDashboard
      geoJsonPath="/fisheriesdata/marinecounties.geojson"
      datasetLabel="Fisheries"
    />
  );
}
