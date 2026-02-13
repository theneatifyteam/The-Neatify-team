import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Header from "../components/SampleHeader";
import "./MyBookingDetails.css";

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0); // ✅ FIX: scroll page to top

    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      let services = [];

      if (Array.isArray(data.services)) {
        services = data.services;
      } else if (typeof data.services === "string") {
        try {
          services = JSON.parse(data.services);
        } catch {
          services = [];
        }
      }

      setBooking({
        ...data,
        services,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return <p className="loading">Loading booking details...</p>;
  }

  if (!booking) {
    return <p className="empty">Booking not found</p>;
  }

  return (
    <>
      <Header searchText={searchText} setSearchText={setSearchText} />

      <div className="booking-details-container">
        <div className="header">
          <h2 className="title">Booking Details</h2>
        </div>

        <p className="section">Customer Details</p>
        <div className="card">
          <p className="bold">{booking.customer_name}</p>
          <p>{booking.email}</p>
          <p>{booking.phone_number}</p>
        </div>

        <p className="section">Service Address</p>
        <div className="card">
          <p>{booking.full_address}</p>
        </div>

        <p className="section">Services</p>
        <div className="card">
          {booking.services.map((s, index) => (
            <div key={index} className="service-row">
              <div>
                <p className="bold">{s.title || s.name}</p>
                <p>{s.duration}</p>
              </div>
              <p>₹{s.price}</p>
            </div>
          ))}
        </div>

        <p className="section">Schedule</p>
        <div className="card">
          <p>
            {booking.booking_date} at {booking.booking_time}
          </p>
        </div>

        <p className="section">Payment</p>
        <div className="card">
          <div className="row">
            <p className="bold">Total</p>
            <p className="bold">₹{booking.total_amount}</p>
          </div>
          <p>
            Status:{" "}
            {["completed", "success"].includes(booking.payment_status)
              ? "PAID"
              : "PENDING"}
          </p>
        </div>
      </div>
    </>
  );
}
