import EcosystemDashboard from "@/components/dashboard/EcosystemDashboard";

export default function Home() {
  return (
    <EcosystemDashboard
      geoJsonPath="/fisheriesdata/20260216_tidied_noncomm_ev.geojson"
      datasetLabel="Non-Commercial Fisheries"
    />
  );
}
