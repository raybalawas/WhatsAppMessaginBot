import React, { useState } from "react";
import "./styles/Settings.css";

function SettingsPage() {
  const [settings, setSettings] = useState({
    username: "Rahul Yadav",
    email: "rahul@example.com",
    password: "",
    notifications: true,
    darkMode: false,
  });

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Settings Saved ✅", settings);
    alert("Settings updated successfully!");
  };

  return (
    <div className="settings-container">
      <h1>⚙️ Settings</h1>
      <form className="settings-form" onSubmit={handleSubmit}>
        {/* Profile Section */}
        <div className="settings-section">
          <h2>👤 Profile</h2>
          <label>
            Username
            <input
              type="text"
              name="username"
              value={settings.username}
              onChange={handleChange}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
            />
          </label>
        </div>

        {/* Security Section */}
        <div className="settings-section">
          <h2>🔐 Security</h2>
          <label>
            Change Password
            <input
              type="password"
              name="password"
              value={settings.password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </label>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <h2>🔔 Preferences</h2>
          <label className="checkbox">
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
            Enable Notifications
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              name="darkMode"
              checked={settings.darkMode}
              onChange={handleChange}
            />
            Dark Mode
          </label>
        </div>

        <button type="submit" className="save-btn">
          💾 Save Changes
        </button>
      </form>
    </div>
  );
}

export default SettingsPage;
