import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/SampleHeader";
import "./Booking.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2026, 2027, 2028];

const TIMES = [
  "9:00 am", "9:30 am", "10:00 am", "10:30 am",
  "11:00 am", "11:30 am", "12:00 pm", "12:30 pm",
  "1:00 pm", "1:30 pm", "2:00 pm", "2:30 pm",
  "3:00 pm", "3:30 pm", "4:00 pm", "4:30 pm"
];

const today = new Date();

/* ================= DATE CHECK ================= */
const isPastDate = (y, m, d) => {
  const date = new Date(y, m, d);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date < base;
};

/* ================= TIME PARSER ================= */
const timeToMinutes = (time) => {
  const [t, meridiem] = time.split(" ");
  let [h, m] = t.split(":").map(Number);

  if (meridiem === "pm" && h !== 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;

  return h * 60 + m;
};

/* ================= TIME CHECK ================= */
const isPastTime = (time, y, m, d) => {
  const now = new Date();
  const slotMinutes = timeToMinutes(time);
  const slotTime = new Date(y, m, d, Math.floor(slotMinutes / 60), slotMinutes % 60);
  return slotTime <= now;
};

/* ================= BLOCK NEXT 1.5 HOURS FROM NOW ================= */
const isWithinNext90Minutes = (time, y, m, d) => {
  const now = new Date();
  const slotMinutes = timeToMinutes(time);
  const slotTime = new Date(y, m, d, Math.floor(slotMinutes / 60), slotMinutes % 60);
  return slotTime <= new Date(now.getTime() + 90 * 60 * 1000);
};

/* ================= CALENDAR ================= */
const getCalendarMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

/* ================= DURATION ================= */
const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (typeof duration === "number") return duration;

  let total = 0;
  const hrMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);
  if (hrMatch) total += Number(hrMatch[1]) * 60;
  if (minMatch) total += Number(minMatch[1]);
  return total;
};

/* ================= PRICE ================= */
const formatPrice = (value) =>
  Number(String(value || "").replace(/[^\d]/g, ""));

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedServices = location.state?.services || [];

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const CALENDAR = getCalendarMatrix(year, month);

  const selectedDayName = selectedDate
    ? FULL_DAYS[new Date(year, month, selectedDate).getDay()]
    : "";

  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + formatPrice(s.price),
    0
  );

  const originalTotalAmount = selectedServices.reduce(
    (sum, s) => sum + formatPrice(s.original_price),
    0
  );

  const discountPercent = selectedServices[0]?.discount_percent || 0;

  const totalDurationMinutes = selectedServices.reduce(
    (sum, s) => sum + parseDurationToMinutes(s.duration),
    0
  );

  return (
    <>
      <Header />

      <div className="booking-container">
        <button className="back-arrow" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="booking-layout">
          <div className="calendar-section">
            <h1>Schedule your service</h1>
            <p className="subtitle">Choose date and time</p>

            <div className="row">
              <div className="month-year">
                <select value={month} onChange={(e) => {
                  setMonth(+e.target.value);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>

                <select value={year} onChange={(e) => {
                  setYear(+e.target.value);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}>
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="scheduler-row">
              <div className="calendar-grid">
                {DAYS.map((d) => <div key={d} className="day-label">{d}</div>)}

                {CALENDAR.map((d, i) =>
                  d ? (
                    <button
                      key={i}
                      className={`date ${selectedDate === d ? "selected" : ""}`}
                      disabled={isPastDate(year, month, d)}
                      onClick={() => {
                        setSelectedDate(d);
                        setSelectedTime(null);
                      }}
                    >
                      {d}
                    </button>
                  ) : <div key={i} className="empty" />
                )}
              </div>

              {selectedDate && (
                <div className="time-section">
                  <h4>Available timings</h4>
                  <div className="time-grid">
                    {TIMES.map((t) => {
                      const isToday =
                        year === today.getFullYear() &&
                        month === today.getMonth() &&
                        selectedDate === today.getDate();

                      const slotMinutes = timeToMinutes(t);
                      const selectedMinutes = selectedTime
                        ? timeToMinutes(selectedTime)
                        : null;

                      const isSlotAfter3PM = slotMinutes >= 15 * 60;

                      const disabled =
                        (isToday &&
                          (
                            isPastTime(t, year, month, selectedDate) ||
                            (isSlotAfter3PM && isWithinNext90Minutes(t, year, month, selectedDate))
                          )) ||
                        (
                          selectedTime === "3:00 pm" &&
                          slotMinutes > selectedMinutes &&
                          slotMinutes <= selectedMinutes + 90
                        );

                      return (
                        <button
                          key={t}
                          disabled={disabled}
                          className={`time-box 
                            ${selectedTime === t ? "selected-time" : ""} 
                            ${disabled ? "disabled-time" : ""}`}
                          onClick={() => !disabled && setSelectedTime(t)}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="summary">
            <h3>Service Details</h3>

            <div className="services-wrapper">
              {selectedServices.map((s, i) => (
                <div key={i} className="service-item">
                  <strong>{s.title || s.name}</strong>
                  <p>{s.duration}</p>
                  <p>₹{formatPrice(s.price)}</p>
                  {s.original_price && <p className="mrp">₹{formatPrice(s.original_price)}</p>}
                  <span className="offer-badge">
                    {discountPercent > 0 ? `${discountPercent}% off` : "Special Offer"}
                  </span>
                </div>
              ))}
            </div>

            {/* ✅ BOOKING DETAILS ADDED */}
            {selectedDate && selectedTime && (
              <div className="booking-details">
                <p>
                  <strong>Booking:</strong>{" "}
                  {selectedDayName}, {selectedDate} {MONTHS[month]} {year} at {selectedTime}
                </p>
              </div>
            )}

            <div className="total-row">
              <span>Total Duration</span>
              <strong>{totalDurationMinutes} mins</strong>
            </div>

            <div className="total-row">
              <span>Total</span>
              <div>
                <strong>₹{totalAmount}</strong>
                {originalTotalAmount > totalAmount && <p className="mrp">₹{originalTotalAmount}</p>}
                <span className="offer-badge">
                  {discountPercent > 0 ? `${discountPercent}% off` : "Special Offer"}
                </span>
              </div>
            </div>

            <button
              className="next-btn"
              disabled={!(selectedDate && selectedTime && selectedServices.length)}
              onClick={() =>
                navigate("/payment", {
                  state: {
                    services: selectedServices,
                    date: selectedDate,
                    time: selectedTime,
                    month,
                    year,
                    total: totalAmount,
                    duration: totalDurationMinutes,
                  },
                })
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
