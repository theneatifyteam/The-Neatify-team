import React from "react";
import "./Download.css";

import playStoreImg from "./google-play_3128279.png";
import appleImg from "./apple.png"; // ✅ USE APPLE IMAGE

export default function Download() {
  return (
    <div className="download-wrapper">
      <div className="download-card">
        <h1>We are arriving soon </h1>
        <p className="subtitle">
          Our mobile app will be available very soon.
        </p>

        <button className="playstore-btn" disabled>
          Coming Soon
        </button>

        <div className="store-list">
          {/* PLAY STORE */}
          <div className="store-item playstore">
            <img src={playStoreImg} alt="Play Store" />
            <span>Play Store</span>
          </div>

          {/* APP STORE */}
          <div className="store-item appstore">
            <img src={appleImg} alt="App Store" />
            <span>App Store</span>
          </div>
        </div>

        <p className="api-text">Meanwhile, explore our APK:</p>
        <a
          href="https://drive.google.com/file/d/171f3uSlPMqNamsFZZjyKunBrBfkybIBd/view?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="api-link"
        >
          https://drive.google.com/file/d/1U5w9g4rhoIBVeSyVFS315x4i_A5ayd9b/view?usp=drive_link
        </a>
      </div>
    </div>
  );
}
