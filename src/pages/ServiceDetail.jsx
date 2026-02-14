import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Header from "../components/SampleHeader";
import PageLoader from "../components/PageLoader";
import "./ServiceDetail.css";

export default function ServiceDetail({ user }) {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [fetchedService, setFetchedService] = useState(null);
  const [isFetching, setIsFetching] = useState(!state?.service);
  const [error, setError] = useState(null);

  const service = state?.service || fetchedService;
  const allServices = state?.allServices || [];

  const [showSummary, setShowSummary] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  /* ================= FETCH SERVICE IF MISSING ================= */
  useEffect(() => {
    if (!state?.service && id) {
      fetchServiceById(id);
    }
  }, [id, state?.service]);

  async function fetchServiceById(serviceId) {
    try {
      setIsFetching(true);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();

      if (error) throw error;
      setFetchedService(data);
    } catch (err) {
      console.error("Error fetching service:", err);
      setError(true);
    } finally {
      setIsFetching(false);
    }
  }

  /* ✅ DISABLE ADD-ONS FOR DEEP CLEANING */
  const isDeepCleaning =
    service?.service_type?.toLowerCase() === "deep cleaning";

  /* PRICE FORMATTER */
  const formatPrice = (value) => {
    if (!value) return "";
    return value.toString().replace(/^₹\s*/, "");
  };

  /* ================= FETCH ADD ONS ================= */
  useEffect(() => {
    if (isDeepCleaning || !service) return;

    supabase
      .from("add_ons")
      .select(
        "id, title, duration, price, original_price, discount_percent, image, work_includes"
      )
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setAddOns(data);
      });
  }, [isDeepCleaning, service]);

  /* ================= INIT MAIN SERVICE ================= */
  useEffect(() => {
    if (service) {
      setSelectedServices([
        {
          id: service.id,
          title: service.title,
          duration: service.duration,
          price: service.price,
          original_price: service.original_price,
          discount_percent: service.discount_percent,
          image: service.image,
          work_includes: service.work_includes,
        },
      ]);
    }
  }, [service]);

  /* ================= ADD ADD-ON ================= */
  const addService = (svc) => {
    if (isDeepCleaning) return;
    if (selectedServices.find((s) => s.id === svc.id)) return;

    setSelectedServices((prev) => [
      ...prev,
      {
        ...svc,
        duration: `${svc.duration} mins`,
      },
    ]);

    setShowAddService(false);
    setShowSummary(true);
  };

  /* ✅ REMOVE ADD-ON */
  const removeService = (id) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== id));
  };

  const descriptionLines = useMemo(() => {
    if (!service) return [];
    return (service.description || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim());
  }, [service]);

  const workIncludesLines = useMemo(() => {
    if (!service?.work_includes) return [];
    return service.work_includes
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim());
  }, [service]);

  if (isFetching) return <PageLoader />;

  if (!service || error) {
    return (
      <>
        <Header user={user} allServices={allServices} />
        <div className="not-found-container">
          <div className="not-found-icon">🏷️</div>
          <h2>Service not found</h2>
          <p>The service you're looking for might have been moved or is no longer available.</p>
          <button className="back-btn" onClick={() => navigate("/services")}>
            Back to Services
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} allServices={allServices} />

      <div className="service-detail">
        <img src={service.image} alt={service.title} className="hero-img" />

        <div className="content">
          <h1>{service.title}</h1>

          <div className="price-row">
            <span className="duration">{service.duration}</span>
            <span className="dot">•</span>

            <span className="offer-price">₹{formatPrice(service.price)}</span>

            {service.original_price && (
              <span className="mrp">
                ₹{formatPrice(service.original_price)}
              </span>
            )}

            <span className="offer-badge">
              {service.discount_percent > 0
                ? `${service.discount_percent}% off`
                : "Special Offer"}
            </span>
          </div>

          <div className="actions">
            <button className="primary" onClick={() => setShowSummary(true)}>
              Book Now
            </button>
          </div>

          <h3>Description</h3>
          {descriptionLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}

          {workIncludesLines.length > 0 && (
            <>
              <h3 className="work-includes-heading">Work Includes</h3>
              <ul className="work-includes">
                {workIncludesLines.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {Array.isArray(service.gallery_images) &&
            service.gallery_images.length > 0 && (
              <>
                <h3 className="gallery-title">Work Frames</h3>
                <div className="gallery">
                  {service.gallery_images.map((img, i) => (
                    <img key={i} src={img} alt="" />
                  ))}
                </div>
              </>
            )}
        </div>

        {/* ================= SUMMARY ================= */}
        {showSummary && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button
                className="modal-close"
                onClick={() => setShowSummary(false)}
              />

              <h2 className="modal-title">Appointment Summary</h2>

              {selectedServices.map((s) => (
                <div key={s.id} className="summary-item">
                  <span className="service-name">{s.title}</span>
                  <span className="service-time">{s.duration}</span>

                  <div className="summary-price">
                    <span className="offer-price">
                      ₹{formatPrice(s.price)}
                    </span>
                    {s.original_price && (
                      <span className="mrp">
                        ₹{formatPrice(s.original_price)}
                      </span>
                    )}
                    <span className="offer-badge">
                      {s.discount_percent > 0
                        ? `${s.discount_percent}% off`
                        : "Special Offer"}
                    </span>
                  </div>

                  {s.id !== service.id && (
                    <button
                      className="remove-btn"
                      onClick={() => removeService(s.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              {!isDeepCleaning && (
                <button
                  className="add-service-btn"
                  onClick={() => {
                    setShowSummary(false);
                    setShowAddService(true);
                  }}
                >
                  + Add-ons
                </button>
              )}

              <button
                className="schedule-btn"
                onClick={() =>
                  navigate("/booking", { state: { services: selectedServices } })
                }
              >
                Schedule Appointment
              </button>
            </div>
          </div>
        )}

        {/* ================= ADD-ONS MODAL ================= */}
        {!isDeepCleaning && showAddService && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddService(false);
                  setShowSummary(true);
                }}
              />

              <h2 className="modal-title">Add-ons</h2>

              {addOns.map((svc) => (
                <div key={svc.id} className="summary-item">
                  <span className="service-name">{svc.title}</span>

                  {/* ✅ FIX: duration already normalized later */}
                  <span className="service-time">{svc.duration} mins</span>

                  <div className="summary-price">
                    <span className="offer-price">
                      ₹{formatPrice(svc.price)}
                    </span>
                    {svc.original_price && (
                      <span className="mrp">
                        ₹{formatPrice(svc.original_price)}
                      </span>
                    )}
                    <span className="offer-badge">
                      {svc.discount_percent > 0
                        ? `${svc.discount_percent}% off`
                        : "Special Offer"}
                    </span>
                  </div>

                  <button
                    className="add-service-btn"
                    onClick={() => addService(svc)}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
