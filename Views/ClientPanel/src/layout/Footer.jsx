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
          <h3>Social Links</h3>
          <ul>
            <li>
              <a href="#">LinkdIn</a>
            </li>
            <li>
              <a href="#">Instagram</a>
            </li>
            <li>
              <a href="#">Threads</a>
            </li>
            <li>
              <a href="#">Twitter</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p>
            Email:{" "}
            <a href="mailto:zerfinispvtltd@gmail.com">
              zerfinispvtltd@gmail.com
            </a>
          </p>
          <p>
            Phone:{" "}
            <a href="tel:+918949540232">
              +91 8949540232
            </a>
          </p>
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
