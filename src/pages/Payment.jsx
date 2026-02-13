import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import "./Payment.css";
import { supabase } from "../components/supabaseClient";
import { processPayment } from "../Services/PaymentService";
import Header from "../components/SampleHeader";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  let { services = [], date, time, month, year } = location.state || {};
  if (typeof services === "string") services = JSON.parse(services);

  const selectedServices = useMemo(() => services || [], [services]);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");

  const [showPincodeAlert, setShowPincodeAlert] = useState(false);
  const [showPaymentFailAlert, setShowPaymentFailAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [criticalError, setCriticalError] = useState(null);

  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  const [isPaying, setIsPaying] = useState(false);

  const fetchPolicy = async (columnName, title) => {
    setModalTitle(title);
    setPolicyModalOpen(true);
    setLoadingPolicy(true);
    setModalContent("");

    try {
      const { data, error } = await supabase
        .from("app_policies")
        .select(columnName)
        .limit(1)
        .single();

      if (error) throw error;
      setModalContent(data?.[columnName] || "No content available.");
    } catch (err) {
      setModalContent(`Failed to load content. Error: ${err.message}`);
    } finally {
      setLoadingPolicy(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profile")
        .select("full_name,email,phone,address,pincode")
        .eq("id", user.id)
        .single();

      if (data) {
        setFirstName(data.full_name || "");
        setEmail(data.email || user.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setZip(data.pincode || "");
      }
    };
    init();
  }, []);

  const totalAmount = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      const price = Number(String(s.price || "0").replace(/[^0-9]/g, ""));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }, [selectedServices]);

  const totalOriginalAmount = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      const op = s.original_price
        ? Number(String(s.original_price).replace(/[^0-9]/g, ""))
        : 0;
      return sum + op;
    }, 0);
  }, [selectedServices]);

  const discountPercent = selectedServices[0]?.discount_percent || 0;

  const totalDurationMins = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      const d = String(s.duration || "").toLowerCase();
      if (d.includes("hr")) return sum + parseInt(d) * 60;
      if (d.includes("min")) return sum + parseInt(d);
      return sum;
    }, 0);
  }, [selectedServices]);

  /* ================= PAYMENT + BOOKING ================= */

  const handlePlaceOrderAndPay = async () => {
    if (!firstName || !email || !phone || !address || !city || !zip) {
      alert("Please fill all required fields");
      return;
    }

    if (!acceptPolicies || !agreeTerms) {
      alert("Please accept the User Policies and Terms & Conditions");
      return;
    }

    if (isPaying) return;
    setIsPaying(true);

    try {
      // ✅ AUTH CHECK (Moved to top)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsPaying(false);
        alert("Please login first");
        return;
      }

      /* ✅ BACKWARD SYNC (ALWAYS UPDATE FIRST) */

      await supabase
        .from("profile")
        .update({
          full_name: firstName,
          phone: phone,
          address: address,
          pincode: zip,
          email: email,
        })
        .eq("id", user.id);

      await supabase
        .from("signup")
        .update({
          full_name: firstName,
          phone: phone,
          email: email,
        })
        .eq("id", user.id);

      /* 1️⃣ PINCODE CHECK */
      const { data: pincodeData } = await supabase
        .from("neatify_service_areas")
        .select("id")
        .eq("pincode", zip.trim())
        .limit(1);

      if (!pincodeData || pincodeData.length === 0) {
        setIsPaying(false);
        setShowPincodeAlert(true);
        return;
      }

      /* 2️⃣ PROCESS PAYMENT */
      const paymentResult = await processPayment(totalAmount, {
        firstName,
        lastName: "",
        email,
        phone,
      });

      if (!paymentResult.success) {
        setIsPaying(false);
        if (paymentResult.error !== "DISMISSED") {
          setShowPaymentFailAlert(true);
        }
        return;
      }

      /* 3️⃣ BOOKING CREATION */

      let formattedDate = "";
      if (year && month !== undefined && date) {
        formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      } else {
        formattedDate = new Date().toISOString().split("T")[0];
      }

      const bookingData = {
        user_id: user.id,
        customer_name: firstName,
        email: email,
        phone_number: phone,
        full_address: `${address}, ${city}, ${zip}`,
        services: selectedServices,
        booking_date: formattedDate,
        booking_time: time || "Not specified",
        total_amount: totalAmount,
        payment_status: "paid",
        payment_verified: true,
        payment_method: "razorpay",
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
        work_status: "assigned",
      };

      // const { error } = await supabase.from("bookings").insert([bookingData]);

      // if (error) {
      //   setCriticalError({
      //     paymentId: paymentResult.paymentId,
      //     message: "Payment successful but booking creation failed."
      //   });
      //   return;
      // }

      console.log("User ID:", user.id);
      console.log("Booking Data:", bookingData);
      console.log("Payment ID:", paymentResult.paymentId);
      /* ================= SAFE BOOKING INSERT ================= */

      // 🔒 We confirm insert with .select() and add retry logic
      let bookingInserted = false;
      

      for (let attempt = 0; attempt < 2 && !bookingInserted; attempt++) {
        const { data, error } = await supabase
          .from("bookings")
          .insert([bookingData])
          .select(); // ✅ IMPORTANT: ensures row is actually returned

        if (!error && data && data.length > 0) {
          bookingInserted = true; // ✅ booking confirmed
        } else {
          console.error(`Booking insert attempt ${attempt + 1} failed:`, error);
        }
      }

      if (!bookingInserted) {
        // 🚨 CRITICAL: Payment was successful but DB insert failed
        setCriticalError({
          paymentId: paymentResult.paymentId,
          message:
            "Payment successful but booking creation failed. Please contact support.",
        });
        return;
      }

      setShowSuccessAlert(true);
    } catch (err) {
      console.error("Order flow error:", err);
      setShowPaymentFailAlert(true);
    } finally {
      setIsPaying(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <Header />

      {isPaying && (
        <div style={overlayStyle}>
          <div
            style={{
              background: "#fff",
              padding: "24px 30px",
              borderRadius: "12px",
              fontWeight: "bold",
            }}
          >
            Processing payment...
          </div>
        </div>
      )}

      {showPincodeAlert && (
        <Modal
          title="Service Unavailable"
          text="Services are not available for this pincode. We will shortly assign services to this pincode."
          onClose={() => setShowPincodeAlert(false)}
        />
      )}

      {showPaymentFailAlert && (
        <Modal
          title="Payment Failed"
          text="The payment process was not completed or failed. Please try again."
          onClose={() => setShowPaymentFailAlert(false)}
        />
      )}

      {criticalError && (
        <Modal
          title="⚠️ Booking Error"
          text={`PAYMENT SUCCESSFUL, BUT BOOKING FAILED. \n\nPayment ID: ${criticalError.paymentId} \n\nPlease take a screenshot and contact support immediately.`}
          onClose={() => setCriticalError(null)}
          isCritical={true}
        />
      )}

      {showSuccessAlert && (
        <Modal
          title="Booking Successful"
          text="Your appointment has been scheduled!"
          onClose={() => navigate("/my-bookings")}
        />
      )}

      {policyModalOpen && (
        <PolicyModal
          title={modalTitle}
          content={modalContent}
          loading={loadingPolicy}
          onClose={() => setPolicyModalOpen(false)}
        />
      )}

      <div className="payment-container">
        <h1 className="page-title">Booking Form</h1>

        <div className="main-row">
          <div className="left">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name *"
            />
            <input value={email} disabled />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone *"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address *"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City *"
            />
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="Zip *"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="message"
            />
          </div>

          <div className="right">
            <h3 className="section-title">Service Details</h3>

            <div className="services-wrapper">
              {selectedServices.map((s, i) => (
                <div key={i} className="service-item">
                  <strong>{s.title || s.name}</strong>
                  <p>{s.duration}</p>
                  <p>{s.price}</p>
                  {s.original_price && (
                    <p className="mrp">₹{s.original_price}</p>
                  )}
                  <span className="offer-badge">
                    {discountPercent > 0
                      ? `${discountPercent}% off`
                      : "Special Offer"}
                  </span>
                  <p>
                    {date} {MONTHS[month]} {year} at {time}
                  </p>
                </div>
              ))}
            </div>

            <div className="summary-bottom">
              <div className="total-row">
                <span>Total Duration</span>
                <strong>{totalDurationMins} mins</strong>
              </div>

              <div className="total-row">
                <span>Total</span>
                <div>
                  <strong>₹{totalAmount}</strong>
                  {totalOriginalAmount > totalAmount && (
                    <p className="mrp">₹{totalOriginalAmount}</p>
                  )}
                  <span className="offer-badge">
                    {discountPercent > 0
                      ? `${discountPercent}% off`
                      : "Special Offer"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "18px" }}>
                <label
                  style={{ display: "flex", gap: "10px", marginBottom: "8px" }}
                >
                  <input
                    type="checkbox"
                    checked={acceptPolicies}
                    onChange={(e) => setAcceptPolicies(e.target.checked)}
                  />
                  <span>
                    I accept the{" "}
                    <span
                      className="policy-link"
                      onClick={() =>
                        fetchPolicy("user_policies", "User Policies")
                      }
                    >
                      User Policies
                    </span>
                  </span>
                </label>

                <label style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <span
                      className="policy-link"
                      onClick={() =>
                        fetchPolicy(
                          "terms_and_conditions",
                          "Terms & Conditions",
                        )
                      }
                    >
                      Terms & Conditions
                    </span>
                  </span>
                </label>
              </div>

              <button
                className="primary-btn"
                onClick={handlePlaceOrderAndPay}
                disabled={!acceptPolicies || !agreeTerms}
              >
                Place Order & Pay
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== MODAL ===== */
function Modal({ title, text, onClose, isCritical }) {
  return (
    <div style={overlayStyle}>
      <div
        style={{ ...cardStyle, border: isCritical ? "2px solid red" : "none" }}
      >
        <h3 style={{ color: isCritical ? "red" : "black" }}>
          {title || "Confirm"}
        </h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>
        <button style={okBtnStyle} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

/* ===== POLICY MODAL ===== */
function PolicyModal({ title, content, loading, onClose }) {
  return (
    <div className="policy-overlay">
      <div className="policy-modal">
        <div className="policy-header">
          <h2>{title}</h2>
          <button className="policy-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="policy-body">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
        <div className="policy-footer">
          <button className="policy-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const cardStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "12px",
  width: "380px",
  textAlign: "center",
};

const okBtnStyle = {
  marginTop: "20px",
  padding: "10px 28px",
  background: "#f4c430",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};