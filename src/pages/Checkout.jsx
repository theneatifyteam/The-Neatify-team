import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../components/supabaseClient";
import { createOrder, verifyPayment } from "../Services/PaymentService";
import "./Checkout.css";

/* Razorpay Loader */
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { services, total, booking, customer } = location.state || {};

  const parsedServices =
    typeof services === "string" ? JSON.parse(services) : services || [];

  const customerData =
    typeof customer === "string" ? JSON.parse(customer) : customer || {};

  /* ================= READ-ONLY CUSTOMER DATA ================= */

  const [firstName] = useState(customerData.firstName || "");
  const [lastName] = useState(customerData.lastName || "");
  const [email] = useState(customerData.email || "");
  const [phone] = useState(customerData.phone || "");
  const [address] = useState(customerData.address || "");
  const [city] = useState(customerData.city || "");
  const [region] = useState(customerData.region || "");
  const [zip] = useState(customerData.zip || "");

  const [razorpayKey, setRazorpayKey] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  /* ================= FORMAT DATE ================= */

  let bookingDateText = "";
  if (booking?.date != null) {
    const d = new Date(booking.year, booking.month, booking.date);
    bookingDateText = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /* ================= FETCH RAZORPAY KEY ================= */

  useEffect(() => {
    axios
      .get("https://backend-4a19.onrender.com/get-razorpay-key")
      .then((res) => setRazorpayKey(res.data.key));
  }, []);

  /* ================= PLACE ORDER & PAY ================= */

  const handlePlaceOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login first");

    const order = await createOrder(Number(total));
    const loaded = await loadRazorpay();
    if (!loaded) return alert("Razorpay failed to load");

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: "INR",
      name: "The Neatify Nation",
      order_id: order.id,

      handler: async (response) => {
        const verifyRes = await verifyPayment(response);
        if (!verifyRes.success) return alert("Payment verification failed");

        await supabase.from("bookings").insert([{
          user_id: user.id,
          customer_name: `${firstName} ${lastName}`,
          email,
          phone_number: phone,
          full_address: `${address}, ${city}, ${region}, ${zip}`,
          services: parsedServices,
          booking_date: `${booking.year}-${booking.month + 1}-${booking.date}`,
          booking_time: booking.time,
          total_amount: Number(total),
          payment_status: "success",
          razorpay_payment_id: response.razorpay_payment_id,
        }]);

        setShowPopup(true);
      },
    };

    new window.Razorpay(options).open();
  };

  /* ================= UI ================= */

  return (
    <div className="checkout-container">
      {/* HEADER */}
      <div className="checkout-header">
        <h2 className="logo">The Neatify Nation</h2>
        <h3 className="checkout-title">CHECKOUT</h3>
      </div>

      {/* ORDER SUMMARY */}
      <h3 className="section-title">Order Summary</h3>
      <div className="card">
        {parsedServices.map((s, i) => (
          <div key={i} className="service-row">
            <div>
              <strong>{s.name || s.title}</strong>
              <p>Date: {bookingDateText}</p>
              <p>Time: {booking.time}</p>
              {s.duration && <p>Duration: {s.duration}</p>}
            </div>
            <div>{s.price}</div>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="total-row">
        <strong>Total</strong>
        <strong>₹{total}</strong>
      </div>

      {/* BILLING ADDRESS */}
      <h3 className="section-title">Billing Address</h3>
      <div className="card">
        <p>{firstName} {lastName}</p>
        <p>{email}</p>
        <p>{phone}</p>
        <p>{address}, {city}, {region}, {zip}</p>
      </div>

      {/* PAY BUTTON */}
      <button className="pay-btn" onClick={handlePlaceOrder}>
        Place Order & Pay
      </button>

      {/* SUCCESS MODAL */}
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>🎉 Success</h2>
            <p>Your booking has been placed successfully.</p>
            <button onClick={() => navigate("/my-bookings")}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
