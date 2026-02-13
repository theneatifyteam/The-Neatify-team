import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./BookingDetails.css";

export default function CompletedBookings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setBooking(data);

        if (data.assigned_staff_email) {
          const { data: staff } = await supabase
            .from("staff_profile")
            .select("full_name")
            .eq("email", data.assigned_staff_email)
            .single();

          if (staff?.full_name) setStaffName(staff.full_name);
        }
      }

      setLoading(false);
    };

    fetchBookingDetails();
  }, [id]);

  if (loading) return <p className="loading">Loading booking...</p>;
  if (!booking) return <p className="empty">Booking not found</p>;

  const finalPaymentStatus = "PAID";

  let services = [];
  if (Array.isArray(booking.services)) services = booking.services;
  else if (typeof booking.services === "string") {
    try {
      services = JSON.parse(booking.services);
    } catch {}
  }

  return (
    <div className="booking-details-container">
      <h2 className="title">Completed Booking</h2>

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
        {services.map((s, i) => (
          <div key={i} className="service-row">
            <div>
              <p className="bold">{s.title || s.name}</p>
              <p>{s.duration}</p>
            </div>
            <p>{s.price}</p>
          </div>
        ))}
      </div>

      <p className="section">Schedule</p>
      <div className="card">
        <p>{booking.booking_date} at {booking.booking_time}</p>
      </div>

      <p className="section">Staff</p>
      <div className="card">
        <p className="bold">✓ Completed</p>
        <p>Staff Name: {staffName || "N/A"}</p>
        <p>Staff Email: {booking.assigned_staff_email}</p>
      </div>

      <p className="section">Payment</p>
      <div className="card">
        <div className="row">
          <p className="bold">Total</p>
          <p className="bold">₹{booking.total_amount}</p>
        </div>
        <p>Status: {finalPaymentStatus}</p>
      </div>

      <button className="back-btn" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
}
