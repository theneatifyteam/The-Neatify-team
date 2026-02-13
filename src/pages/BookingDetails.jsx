import { useEffect, useState, useMemo } from "react";
import { IoAlertCircleOutline, IoClose } from "react-icons/io5";

import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./BookingDetails.css";

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEligibleToCancel, setIsEligibleToCancel] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelledPopup, setShowCancelledPopup] = useState(false);

  /* SERVICES */
  const services = useMemo(() => {
    if (!booking?.services) return [];
    if (Array.isArray(booking.services)) return booking.services;
    if (typeof booking.services === "string") {
      try {
        return JSON.parse(booking.services);
      } catch {
        return [];
      }
    }
    return [];
  }, [booking?.services]);

  /* FETCH STAFF NAME */
  const fetchStaffName = async (email) => {
    if (!email) {
      setStaffName("");
      return;
    }

    const trimmedEmail = email.trim();

    try {
      // 1. Try staff_profile table
      const { data: staff } = await supabase
        .from("staff_profile")
        .select("full_name")
        .eq("email", trimmedEmail)
        .single();

      if (staff?.full_name) {
        setStaffName(staff.full_name);
        return;
      }

      // 2. Fallback to signup table
      const { data: signup } = await supabase
        .from("signup")
        .select("full_name")
        .eq("email", trimmedEmail)
        .single();

      if (signup?.full_name) {
        setStaffName(signup.full_name);
        return;
      }

      // 3. Fallback to profile table
      const { data: profile } = await supabase
        .from("profile")
        .select("full_name")
        .eq("email", trimmedEmail)
        .single();

      if (profile?.full_name) {
        setStaffName(profile.full_name);
        return;
      }

      // 4. LAST RESORT: Extract name from email (e.g., ravi@gmail.com -> Ravi)
      const namePart = trimmedEmail.split("@")[0];
      const capitalized =
        namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
      setStaffName(capitalized);
    } catch (err) {
      console.error("Error fetching staff name:", err);
      // Fallback to name from email even on error
      const namePart = trimmedEmail.split("@")[0];
      const capitalized =
        namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
      setStaffName(capitalized);
    }
  };

  /* FETCH BOOKING */
  useEffect(() => {
    const fetchBooking = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
        if (data.payment_status === "success") {
          await supabase
            .from("bookings")
            .update({ payment_status: "paid" })
            .eq("id", data.id);

          data.payment_status = "paid";
        }

        setBooking(data);
        if (data.assigned_staff_email) {
          fetchStaffName(data.assigned_staff_email);
        }
      }

      setLoading(false);
    };

    fetchBooking();
  }, [id]);

  /* REALTIME UPDATE */
  useEffect(() => {
    if (!booking?.id) return;

    const channel = supabase
      .channel(`booking:${booking.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          setBooking(payload.new);
          if (payload.new.assigned_staff_email) {
            fetchStaffName(payload.new.assigned_staff_email);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [booking?.id]);

  /* CANCELLATION ELIGIBILITY */
  useEffect(() => {
    if (!booking?.id) return;

    const checkEligibility = async () => {
      const { data } = await supabase.rpc(
        "check_cancellation_eligibility",
        { booking_uuid: booking.id }
      );

      setIsEligibleToCancel(!!data);
    };

    checkEligibility();
  }, [booking?.id]);

  /* CONFIRM CANCEL (FIXED) */
  const confirmCancellation = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason.");
      return;
    }

    setCancelling(true);

    try {
      //  Re-check eligibility (6-hour rule)
      const { data: eligible } = await supabase.rpc(
        "check_cancellation_eligibility",
        { booking_uuid: booking.id }
      );

      if (!eligible) {
        alert("Cancellation window closed. You can cancel only within 6 hours.");
        setCancelling(false);
        return;
      }

      //  Cancel + refund tracking
      const { error } = await supabase
        .from("bookings")
        .update({
          work_status: "CANCELLED",
          cancel_requested: true,
          cancel_reason: cancelReason,
          cancel_time: new Date().toISOString(),
          refund_status: "PENDING", //
        })
        .eq("id", booking.id);

      if (error) throw error;

      setShowCancelModal(false);
      setShowCancelledPopup(true);
    } catch (err) {
      alert("Cancellation failed. Please try again.");
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!booking) return <p>No booking found</p>;

  const showCancelButton =
    booking.work_status !== "CANCELLED" &&
    booking.work_status !== "COMPLETED" &&
    (isEligibleToCancel || booking.cancel_requested === false);

  return (
    <div className="booking-details-container">
      <h2 className="title">Booking Details</h2>

      <div className="card">
        <p className="bold">{booking.customer_name}</p>
        <p>{booking.email}</p>
        <p>{booking.phone_number}</p>
      </div>

      <div className="card">
        <p>{booking.full_address}</p>
      </div>

      <div className="card">
        {services.map((s, i) => (
          <div key={i} className="service-row">
            <p className="bold">{s.title || s.service_name}</p>
            <p>{s.price}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p>
          {booking.booking_date} at {booking.booking_time}
        </p>
      </div>

      {/* STAFF ASSIGNMENT */}
      {booking.work_status !== "CANCELLED" &&
        booking.work_status !== "COMPLETED" && (
          <div className="card">
            {!booking.assigned_staff_email ? (
              <p className="pending-text">⏳ Staff will be assigned shortly</p>
            ) : (
              <>
                <p className="bold success">✓ Staff Assigned</p>
                <p>{staffName}</p>
                <p>{booking.assigned_staff_email}</p>

                <div className="otp-container">
                  <div className="otp-box">
                    <p className="otp-label">Start OTP</p>
                    <p className="otp-code">
                      {booking.startotp || "------"}
                    </p>
                  </div>
                  <div className="otp-box">
                    <p className="otp-label">End OTP</p>
                    <p className="otp-code">
                      {booking.endotp || "------"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      <div className="card">
        <p className="bold">Total: ₹{booking.total_amount}</p>
        <p>Status: {booking.payment_status}</p>
      </div>

      {/* CANCELLED STATUS (FIXED) */}
      {booking.work_status === "CANCELLED" && (
        <div className="cancelled-box">
          {booking.refund_status === "REFUNDED"
            ? "✓ Refund Completed"
            : "⏳ Refund Pending (5–7 working days)"}
        </div>
      )}

      <div className="actions-container">
        {showCancelButton && (
          <button
            className="cancel-btn"
            onClick={() => setShowCancelModal(true)}
            disabled={cancelling}
          >
            ✕ Cancel Booking
          </button>
        )}

        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal cancel-modal">
            <button
              className="modal-close-btn"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              <IoClose />
            </button>

            <div className="modal-icon warning-icon">
              <IoAlertCircleOutline />
            </div>

            <h3>Cancel Booking?</h3>
            <p className="modal-subtitle">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>

            <div className="form-group">
              <label className="modal-label">Reason for cancellation</label>
              <textarea
                placeholder="Please tell us why you're cancelling..."
                className="modal-textarea"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Booking
              </button>

              <button
                className="danger-btn"
                onClick={confirmCancellation}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelledPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Your booking has been cancelled successfully.</p>
            <button onClick={() => navigate("/my-bookings")}>OK</button>
          </div>
        </div>
      )}

    </div>
  );
}
