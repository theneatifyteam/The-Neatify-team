import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FiSearch, FiX, FiUser } from "react-icons/fi";
import "./Header.css";

export default function Header({
  searchText: propSearchText,
  setSearchText: propSetSearchText,
  user,
  allServices = []
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle optional search props for standalone use on other pages
  const [internalSearchText, setInternalSearchText] = useState("");
  const searchText = propSearchText !== undefined ? propSearchText : internalSearchText;
  const setSearchText = propSetSearchText || setInternalSearchText;

  const filteredLiveResults = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return [];
    return allServices
      .filter((s) => {
        return (
          s.title?.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term) ||
          (s.category || s.service_type)?.toLowerCase().includes(term)
        );
      })
      .slice(0, 10);
  }, [allServices, searchText]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

            {/* MOBILE SEARCH OVERLAY */}
            {mobileSearchOpen && (
              <div className="mobile-search-open">
                <div className="search-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
                  <FiSearch size={18} />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setMobileSearchOpen(false);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (searchText) {
                        setSearchText("");
                      } else {
                        setMobileSearchOpen(false);
                      }
                    }}
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="search-suggestions">
                  {filteredLiveResults.length > 0 ? (
                    <>
                      <h3>Search Results</h3>
                      <div className="search-results-list">
                        {filteredLiveResults.map((s) => (
                          <div
                            key={s.id}
                            className="search-result-item"
                            onClick={() => {
                              setMobileSearchOpen(false);
                              navigate(`/service/${s.id}`, {
                                state: { service: s, allServices },
                              });
                            }}
                          >
                            <span className="result-title">{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>Popular Services</h3>
                      <div className="suggestion-chips">
                        {[
                          "Bathroom",
                          "Kitchen",
                          "Deep Cleaning",
                          "Sofa Cleaning",
                          "Balcony Cleaning",
                          "All Services",
                        ].map((service) => (
                          <span
                            key={service}
                            className="suggestion-chip"
                            onClick={() => {
                              if (service === "All Services") {
                                setSearchText("");
                              } else {
                                setSearchText(service);
                              }
                              setMobileSearchOpen(false);
                              goServices(); // Navigate to main services list
                            }}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="my-bookings-btn"
                  style={{ width: "100%", marginTop: "auto", marginBottom: "20px" }}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    goServices();
                  }}
                >
                  Show Results
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

      {/* ✅ MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <img src="/logo.png" alt="Neatify" className="logo" style={{ height: '32px' }} />
              <button
                className="close-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-links">
              <div className="mobile-link-item" onClick={() => { goHome(); setMobileMenuOpen(false); }}>
                Home
              </div>

              <div className="mobile-link-item" onClick={() => { goServices(); setMobileMenuOpen(false); }}>
                Services
              </div>

              <div
                className="mobile-link-item"
                onClick={() => {
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
              >
                Contact
              </div>

              <div className="mobile-link-item" onClick={() => { setHelpOpen(true); setMobileMenuOpen(false); }}>
                Help
              </div>

              {user ? (
                <>
                  <div className="mobile-link-item" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}>
                    Profile
                  </div>
                  <div className="mobile-link-item" onClick={() => { navigate("/my-bookings"); setMobileMenuOpen(false); }}>
                    My Bookings
                  </div>
                  <div className="mobile-link-item logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                    Logout
                  </div>
                </>
              ) : (
                <div className="mobile-link-item" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>
                  Login
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ HELP MODAL */}
      {helpOpen && (
        <div className="help-overlay" onClick={() => setHelpOpen(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button className="help-close" onClick={() => setHelpOpen(false)}>
              ✕
            </button>
            <h2 style={{ marginBottom: "20px", color: "#f4c430" }}>Need Help?</h2>
            <p style={{ fontSize: "16px", marginBottom: "15px" }}>
              Our support team is here for you!
            </p>
            <div
              style={{
                background: "#f9fafb",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontWeight: "600", fontSize: "18px" }}>Call us at:</p>
              <a
                href="tel:+918882823611"
                style={{
                  fontSize: "20px",
                  color: "#000",
                  textDecoration: "underline",
                }}
              >
                +91 88828 23611
              </a>
            </div>
            <button
              className="my-bookings-btn"
              style={{ width: "100%" }}
              onClick={() => setHelpOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </>
  );
}
