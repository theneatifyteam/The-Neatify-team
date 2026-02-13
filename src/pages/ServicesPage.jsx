import React, { useState } from "react";
import CategoryTabs from "../components/CategoryTabs";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("bathroom");

  const tabs = [
    { label: "Bathroom", value: "bathroom" },
    { label: "Kitchen", value: "kitchen" },
    { label: "Deep Cleaning", value: "deep-cleaning" },
    { label: "Balcony Cleaning", value: "balcony" },
    { label: "Additional Services", value: "additional" },
    { label: "All Services", value: "all" },
  ];

  return (
    <>
      {/* CATEGORY TABS GO HERE */}
      <CategoryTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* SERVICES CONTENT */}
      <div>
        {activeTab === "bathroom" && <Bathroom />}
        {activeTab === "kitchen" && <Kitchen />}
        {activeTab === "deep-cleaning" && <DeepCleaning />}
        {activeTab === "balcony" && <Balcony />}
        {activeTab === "additional" && <Additional />}
        {activeTab === "all" && <AllServices />}
      </div>
    </>
  );
}
