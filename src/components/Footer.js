import React from "react";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiInstagram,
  FiFacebook,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        {/* LEFT */}
        <div className="footer-left">
          <h2>
            Ready for a <br /> Cleaner Home?
          </h2>
          <p>
            Experience the difference with The Neatify Team.
            Professional, reliable, and strictly monochromatic.
          </p>
        </div>

        {/* CENTER */}
        <div className="footer-center">
          <h3>Contact Us</h3>

          <div className="contact-item">
            <FiPhone />
            <a
              href="https://wa.me/917617618567"
              target="_blank"
              rel="noreferrer"
            >
              +91 7617618567
            </a>
          </div>

          <div className="contact-item">
            <FiMail />
            <a href="mailto:info@theneatifyteam.in">
              info@theneatifyteam.in
            </a>
          </div>

          <div className="contact-item">
            <FiMapPin />
            <span>Hyderabad, Telangana</span>
          </div>

          {/* SOCIAL LINKS */}
          <div className="footer-social-inline">
            <span className="footer-social-inline-title">Social Links</span>

            <div className="footer-social-inline-icons">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/theneatifyteam/"
                target="_blank"
                rel="noreferrer"
              >
                <FiInstagram />
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61587541194874"
                target="_blank"
                rel="noreferrer"
              >
                <FiFacebook />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/917617618567"
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="footer-right">
          <div className="footer-logo-box">
            <img
              src="/footerlogo.png"
              alt="The Neatify Team Logo"
              className="footer-logo"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <span>© 2026 The Neatify Team™</span>
        <span>Terms and conditions apply for all services.</span>
      </div>
    </footer>
  );
}
