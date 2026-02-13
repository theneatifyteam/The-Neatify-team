import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import bgImage from "../components/Background-Image.png";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setPincode(data.pincode || "");
      }
    };

    loadProfile();
  }, [navigate]);

  /* ================= UPDATE PROFILE ================= */
  const handleUpdateProfile = async () => {
    const { error } = await supabase
      .from("profile")
      .update({
        full_name: fullName,
        phone,
        address,
        pincode,
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile updated successfully");
    setIsEditing(false);
  };

  /* ================= BACK TO SERVICES ================= */
  const handleLogout = () => {
    navigate("/services"); // ✅ NO signOut
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="profile-container">
        <h2 className="profile-title">My Profile</h2>

        <input
          className="profile-input"
          placeholder="Enter full name"
          value={fullName}
          disabled={!isEditing}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          className="profile-input"
          placeholder="Email"
          value={email}
          disabled
        />

        <input
          className="profile-input"
          placeholder="Enter phone number"
          value={phone}
          disabled={!isEditing}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="profile-input"
          placeholder="Enter address"
          value={address}
          disabled={!isEditing}
          onChange={(e) => setAddress(e.target.value)}
        />

        <input
          className="profile-input"
          placeholder="Enter pincode"
          value={pincode}
          disabled={!isEditing}
          onChange={(e) => setPincode(e.target.value)}
        />

        <div className="profile-actions">
          {!isEditing ? (
            <button
              className="primary-btn half-btn"
              style={{ width: "auto", marginTop: 0, flex: 1 }}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <button
              className="primary-btn half-btn"
              style={{ width: "auto", marginTop: 0, flex: 1 }}
              onClick={handleUpdateProfile}
            >
              Update Profile
            </button>
          )}
        </div>

        <button className="logout-simple" onClick={handleLogout}>
          Back to service
        </button>
      </div>
    </div>
  );
}
