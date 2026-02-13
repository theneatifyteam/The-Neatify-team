import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FiUser } from "react-icons/fi";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleProfile = () => {
    navigate("/profile");
    setDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-top">
        {/* LEFT GROUP */}
        <div className="header-left">
          <img
            src="/logo.png"
            alt="Neatify"
            className="logo"
            onClick={() => navigate("/")}
          />

          <div className="nav-links">
            <span onClick={() => navigate("/")}>Home</span>
            <span onClick={() => navigate("/services")}>Services</span>
            <span>Contact</span>
          </div>
        </div>

        {/* RIGHT GROUP */}
        <div className="header-icons">
          <button
            className="my-bookings-btn"
            onClick={() => navigate("/my-bookings")}
          >
            My Bookings
          </button>

          {/* USER MENU */}
          <div className="user-menu">
            <div
              className="user-circle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FiUser size={18} />
            </div>

            {dropdownOpen && (
              <div className="dropdown">
                <p onClick={handleProfile}>Profile</p>
                <p onClick={handleLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
