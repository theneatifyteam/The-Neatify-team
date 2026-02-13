import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./components/supabaseClient";

import Header from "./components/Header";
import CategoryTabs from "./components/CategoryTabs";
import ServiceCard from "./components/ServiceCard";
import { FiArrowUp } from "react-icons/fi";

import "./Services.css";

export default function Services({ user }) {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState(""); // ✅ important
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);

  const [heroImages, setHeroImages] = useState([]);
  const [currentHero, setCurrentHero] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    fetchServices();
    fetchHeroImages();
  }, []);

  async function fetchServices() {
    try {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      setServices(data || []);
    } catch {
      setError("Failed to load services.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchHeroImages() {
    const { data, error } = await supabase
      .from("web-hero-images")
      .select("image_path")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return;

    const urls = data
      .map((row) => {
        const { data: img } = supabase.storage
          .from("web-hero-images")
          .getPublicUrl(row.image_path);
        return img?.publicUrl;
      })
      .filter(Boolean);

    setHeroImages(urls);
  }

  useEffect(() => {
    if (heroImages.length > 0) setCurrentHero(0);
  }, [heroImages]);

  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages]);

  const tabs = useMemo(() => {
    const ORDER = [
      "BATHROOM",
      "KITCHEN",
      "DEEP_CLEANING",
      "BALCONY",
      "ADDITIONAL",
    ];

    const availableTypes = Array.from(
      new Set(services.map((s) => s.service_type || s.category).filter(Boolean))
    );

    const orderedTabs = ORDER.filter((type) =>
      availableTypes.includes(type)
    ).map((type) => ({
      label: type
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: type,
    }));

    const remainingTabs = availableTypes
      .filter((type) => !ORDER.includes(type))
      .map((type) => ({
        label: type
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        value: type,
      }));

    // ALL stays last but won't open by default
    return [...orderedTabs, ...remainingTabs, { label: "All Services", value: "ALL" }];
  }, [services]);

  // ✅ STRONG FIX – Always open first real category (not ALL)
  useEffect(() => {
    if (tabs.length > 0) {
      const firstRealTab = tabs.find(tab => tab.value !== "ALL");
      if (firstRealTab) {
        setActiveCategory(firstRealTab.value);
      }
    }
  }, [tabs]);

  let filteredServices =
    activeCategory === "ALL"
      ? services
      : services.filter(
          (s) => (s.service_type || s.category) === activeCategory
        );

  filteredServices = filteredServices.filter((s) =>
    s.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  const groupedServices = useMemo(() => {
    const grouped = {};
    filteredServices.forEach((service) => {
      const category = service.service_type || service.category || "Other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(service);
    });

    Object.keys(grouped).forEach((category) => {
      grouped[category].sort(
        (a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)
      );
    });

    return grouped;
  }, [filteredServices]);

  return (
    <div className="page">
      <Header searchText={searchText} setSearchText={setSearchText} user={user} />

      {heroImages.length > 0 && (
        <div className="hero-container">
          <div
            className="hero"
            style={{ backgroundImage: `url(${heroImages[currentHero]})` }}
          >
            <div className="hero-dots">
              {heroImages.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentHero ? "active" : ""}`}
                  onClick={() => setCurrentHero(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="services-section" style={{ scrollMarginTop: "90px" }}>
        <CategoryTabs
          activeTab={activeCategory}
          onChange={setActiveCategory}
          tabs={tabs}
        />

        {loading ? (
          <div className="loader">Loading services...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : filteredServices.length === 0 ? (
          <div className="no-services">No services found.</div>
        ) : (
          <>
            {Object.entries(groupedServices).map(([category, items]) => (
              <section key={category} className="service-category">
                <h2 className="category-title">
                  {category
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </h2>

                <div className="services-grid">
                  {items.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onView={() =>
                        navigate(`/service/${service.id}`, {
                          state: { service, allServices: services },
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="services-go-up-wrapper">
              <button
                className="services-go-up"
                onClick={scrollToTop}
                aria-label="Go to top"
              >
                <FiArrowUp />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
