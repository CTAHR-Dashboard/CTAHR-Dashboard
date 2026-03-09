import EcosystemDashboard from "@/components/dashboard/EcosystemDashboard";
import CommFisheriesDashboard from "@/components/dashboard/commFisheriesDashboard";

export default function Home() {
  return (
    
    <EcosystemDashboard
      geoJsonPath="/fisheriesdata/marinecounties.geojson"
      datasetLabel="Fisheries"
    />
    /*<CommFisheriesDashboard />*/
  );
}
