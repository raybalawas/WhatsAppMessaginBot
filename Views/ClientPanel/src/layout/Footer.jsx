import React from "react";
import "./styles/Footer.css"; // Create a Footer.css for styling
import logo from "../assets/zerfinislogo.png";
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Section */}
        <div className="footer-about">
          <img src={logo} alt="Zerfinis Pvt Ltd" className="footer-logo" />
          <p>Bulk messaging made easy — connect, engage, and grow.</p>
        </div>

        {/* Middle Section */}
        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#">Dashboard</a>
            </li>
            <li>
              <a href="#">Campaigns</a>
            </li>
            <li>
              <a href="#">Reports</a>
            </li>
            <li>
              <a href="#">Pricing</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p>Email: zerfinispvtltd@gmail.com</p>
          <p>Phone: +91 8949540232</p>
          <div className="social-icons">
            <a href="#">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Zerfinis Pvt Ltd. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
