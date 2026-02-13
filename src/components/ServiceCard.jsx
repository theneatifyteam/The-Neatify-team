import React from "react";
import "../Services.css";
import "./ServiceCard.css";

export default function ServiceCard({ service, onView, onBookNow }) {
  return (
    <div className="service-card">
      {service.image && (
        <img
          src={service.image}
          alt={service.title}
          className="service-card-image"
          loading="lazy"
        />
      )}

      <div className="service-card-content">
        <h3 className="service-title">{service.title}</h3>

        {service.duration && (
          <p className="service-duration">{service.duration}</p>
        )}

        {/* ===== PRICE SECTION (UPDATED) ===== */}
        <div className="service-price-row">
          <span className="offer-price">{service.price}</span>

          {service.original_price && (
            <span className="mrp">₹{service.original_price}</span>
          )}

          <span className="offer-badge">
            {service.discount_percent > 0
              ? `${service.discount_percent}% off`
              : "Special Offer"}
          </span>
        </div>

        <div className="actions">
          {/* View Service */}
          <button
            type="button"
            className="view-service-btn"
            onClick={() => onView(service.id)}
          >
            View Service
          </button>

          {/* Book Now */}
          {onBookNow && (
            <button
              type="button"
              className="book-now-btn"
              onClick={() => onBookNow(service.id)}
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}