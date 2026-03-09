import EcosystemDashboard from "@/components/dashboard/EcosystemDashboard";
import CommFisheriesDashboard from "@/components/dashboard/commFisheriesMap";

export default function Home() {
  return (
    
    <EcosystemDashboard
      geoJsonPath="/fisheriesdata/marinecounties.geojson"
      datasetLabel="Fisheries"
    />
    /*<CommFisheriesDashboard />*/
  );
}
