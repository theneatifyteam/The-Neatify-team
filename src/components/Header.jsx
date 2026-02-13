import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FiSearch, FiX, FiUser } from "react-icons/fi";
import "./Header.css";

export default function Header({ searchText, setSearchText, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // ✅ Added

  const APK_DOWNLOAD_URL =
    "https://github.com/theneatifyteam/customer-App-Apk-Repo/releases/download/v1.0.0/application-e91115be-8ff3-41bd-be59-787e5b0e62b1.apk";
  const handleProfile = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    navigate("/login");
  };

  const goHome = () => {
    navigate("/", { replace: false });
  };

  const goServices = () => {
    const scrollToServices = () => {
      const section = document.getElementById("services-section");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (location.pathname === "/services") {
      scrollToServices();
    } else {
      navigate("/services", { replace: false });
      setTimeout(scrollToServices, 300);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div className="header-left">
            <img
              src="/logo.png"
              alt="Neatify"
              className="logo"
              onClick={goHome}
            />

            <div className="nav-links desktop-only">
              <span onClick={goHome}>Home</span>
              <span onClick={goServices}>Services</span>
              <span
                onClick={() =>
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Contact
              </span>
              <span onClick={() => setHelpOpen(true)}>Help</span>
            </div>
          </div>

          <div className="header-icons">

            {/* DESKTOP SEARCH */}
            <div className="search-wrapper right-search desktop-only">
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button onClick={() => setSearchText("")}>
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* MOBILE SEARCH ICON */}
            {!mobileSearchOpen && (
              <button
                className="mobile-search-icon"
                onClick={() => setMobileSearchOpen(true)}
              >
                <FiSearch size={20} />
              </button>
            )}

            {/* MOBILE SEARCH INPUT */}
            {mobileSearchOpen && (
              <div className="search-wrapper mobile-search-open">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchText("");
                    setMobileSearchOpen(false);
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>
            )}

            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="my-bookings-btn desktop-only custom-download-btn"
            >
              Download
            </a>

            {user ? (
              <>
                <button
                  className="my-bookings-btn desktop-only"
                  onClick={() => navigate("/my-bookings")}
                >
                  My Bookings
                </button>

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
                      <p onClick={() => navigate("/my-bookings")}>
                        My Bookings
                      </p>
                      <p onClick={handleLogout}>Logout</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                className="my-bookings-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
