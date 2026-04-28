"use client";

interface FilterSidebarProps {
  layer: "fisheries" | "extents";
  setLayer: (layer: "fisheries" | "extents") => void;
  onLayerChange?: () => void;
}

export default function FilterSidebar({ layer, setLayer, onLayerChange }: FilterSidebarProps) {
  const handleLayer = (val: "fisheries" | "extents") => {
    setLayer(val);
    onLayerChange?.();
  };

  return (
    <div className="left-nav">
      <img src="/logo.png" className="left-nav-logo" alt="Oleson Lab" />
      <div className="left-nav-title">Hawaiʻi</div>
      <div className="left-nav-subtitle">Ecosystem Accounts</div>

      <div
        className={`left-nav-item ${layer === "fisheries" ? "active" : ""}`}
        onClick={() => handleLayer("fisheries")}
      >
        Fisheries
      </div>
      <div
        className={`left-nav-item ${layer === "extents" ? "active" : ""}`}
        onClick={() => handleLayer("extents")}
      >
        Ecosystem Extents
      </div>
    </div>
  );
}
