/*
 * Legacy left sidebar with dataset toggle buttons (Non-Commercial / Commercial).
 * This component is no longer used — its functionality was absorbed into
 * EcosystemDashboard and FilterSidebar. Kept here for reference.
 */

import "./dashboard.css";
import Image from "next/image";

interface LeftBarProps {
    dataset: "noncomm" | "comm";
    setDataset: (val: "noncomm" | "comm") => void;
}

export default function ToggleLeftmostBar ({
    dataset,
    setDataset,
}: LeftBarProps) {


    return (
        <div className="sidebar-tabs">
            <div className="tabs-header">
                <Image src="/icon.png" alt="Lab Icon" width={150} height={32} />
                Hawaiʻi
                <div className="tabs-subtitle">
                Ecosystem Accounts
                </div>
            </div>

            <div
                className={`tab ${dataset === "noncomm" ? "active" : ""}`}
                onClick={() => setDataset("noncomm")}
            >
                Non-Commercial Fishery Values
            </div>

            <div
                className={`tab ${dataset === "comm" ? "active" : ""}`}
                onClick={() => setDataset("comm")}
            >
                Commercial Fishery Values
            </div>

        </div>
    )
}
