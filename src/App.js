import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./components/supabaseClient";

/* COMPONENTS */
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import Footer from "./components/Footer";

/* PAGES */
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Services from "./Services";
import Profile from "./pages/Profile";
import ServiceDetail from "./pages/ServiceDetail";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import CompletedBookings from "./pages/CompletedBookings";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
// import Download from "./pages/Download"; // Removed

/* ---------------- PAGE TO PAGE LOADER ---------------- */

function PageTransitionLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;
  return <PageLoader />;
}

/* ---------------- APP LAYOUT ---------------- */

function AppLayout({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hideFooterRoutes = ["/login", "/signup", "/profile", "/update-password", "/forgot-password"];

  useEffect(() => {
    // 1. Proactive check for recovery hash (covers initial landing)
    if (window.location.hash.includes("type=recovery")) {
      navigate("/update-password");
      return;
    }

    // 2. Event listener for session changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/update-password");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate, location.pathname]);


  const [footerReady, setFooterReady] = useState(false);

  useEffect(() => {
    setFooterReady(false);

    requestAnimationFrame(() => {
      setTimeout(() => {
        setFooterReady(true);
      }, 600);
    });
  }, [location.pathname]);

  const hideFooter =
    hideFooterRoutes.includes(location.pathname) || !footerReady;

  return (
    <>
      <PageTransitionLoader />

      <Routes>
        {/* ✅ FIXED */}
        <Route
          path="/"
          element={<Navigate to="/services" replace />}
        />

        <Route
          path="/login"
          element={user ? <Navigate to="/services" /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/services" /> : <Signup />}
        />

        <Route path="/services" element={<Services user={user} />} />
        <Route path="/service/:id" element={<ServiceDetail user={user} />} />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/booking"
          element={user ? <Booking /> : <Navigate to="/login" />}
        />
        <Route
          path="/payment"
          element={user ? <Payment /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-bookings"
          element={user ? <MyBookings /> : <Navigate to="/login" />}
        />
        <Route
          path="/booking-details/:id"
          element={user ? <BookingDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/completed-bookings/:id"
          element={<CompletedBookings />}
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* ✅ ONLY ADDED ROUTE */}
        {/* Route removed: Download */}

        {/* ✅ FIXED */}
        <Route
          path="*"
          element={<Navigate to="/services" replace />}
        />
      </Routes>

      {!hideFooter && <Footer />}
    </>
  );
}

/* ---------------- ROOT APP ---------------- */

export default function App() {
  const [user, setUser] = useState(null);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const start = Date.now();

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      const MIN_TIME = 1000;
      const elapsed = Date.now() - start;

      setTimeout(() => {
        setShowLoader(false);
      }, Math.max(MIN_TIME - elapsed, 0));
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (showLoader) {
    return <PageLoader />;
  }

  return (
    <Router>
      <ScrollToTop />
      <AppLayout user={user} />
    </Router>
  );
}
