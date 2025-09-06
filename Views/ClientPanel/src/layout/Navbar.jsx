import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles/Navbar.css";
import logo from "../assets/zerfinislogo.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* Left Logo */}
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="Zerfinis Pvt Ltd" />
        </Link>
      </div>

      {/* Hamburger icon for mobile */}
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </div>

      {/* Navbar Links + Buttons for mobile */}
      <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
        <ul className="navbar-links">
          <li>
            <a href="#">Dashboard</a>
          </li>
          <li>
            <a href="/campaign">Campaigns</a>
          </li>
          <li>
            <a href="#">Status</a>
          </li>
          <li>
            <a href="#">Reports</a>
          </li>
          <li>
            <a href="#">Settings</a>
          </li>
        </ul>
      </div>
      {/* Buttons inside dropdown on mobile */}
      <div className="navbar-actions">
        {/* <Link to="/login"> */}
        <button className="login-btn">Login</button>
        {/* </Link> */}
        <Link to="/signup">
          <button className="signup-btn">Sign Up</button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
