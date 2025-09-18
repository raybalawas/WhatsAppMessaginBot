import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Navbar.css";
import logo from "../assets/zerfinislogo.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 0 = user, 1 = superadmin
  const navigate = useNavigate();

  const handleProtectedLink = (path) => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");
    const parsedUser = user ? JSON.parse(user) : null;
    const role = parsedUser ? parsedUser.role : null;

    if (token && role !== null) {
      // Prevent normal user from accessing admin routes
      if (role === "0" && path.startsWith("/admin")) {
        alert("Checking access permissions...");
        alert("🚫 You do not have permission to access this page.");
        return;
      }
      // Allow navigation
      navigate(path);
    } else {
      alert("⚠ You must be logged in to access this page.");
      navigate("/signin");
    }
  };
  // Check login status and user role on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser"); // Stored as stringified JSON

    if (token && user) {
      const parsedUser = JSON.parse(user);
      setIsLoggedIn(true);
      setUserRole(parsedUser.role); // Assuming role is stored as string "0" or "1"
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/"); // Redirect to signin page after logout
    console.log("User logged out");
    alert("You have been logged out.");
  };

  const handleHomePage = (path) => {
    if (!isLoggedIn) {
      navigate(path);
    } else {
      // alert("You must be logged out to access this page.");
      // navigate("/signin");
      if (userRole === "0") navigate("/dashboard");
      if (userRole === "1") navigate("/admin-dashboard");
    }
  };
  // const handleHomePage = (path) => {
  //   navigate(path);
  // };
  return (
    <nav className="navbar">
      {/* Left Logo */}
      <div className="navbar-logo">
        <p onClick={() => handleHomePage("/")}>
          <img src={logo} alt="Zerfinis Pvt Ltd" />
        </p>
      </div>

      {/* Hamburger icon for mobile */}
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </div>

      {/* Navbar Links */}
      <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
        <ul className="navbar-links">
          {(!isLoggedIn || (isLoggedIn && userRole === "0")) && (
            <>
              <li>
                <p onClick={() => handleProtectedLink("/dashboard")}>
                  Dashboard
                </p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/campaign")}>
                  Campaigns
                </p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/status")}>Status</p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/reports")}>Reports</p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/setting")}>Settings</p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/plans")}>Plans</p>
              </li>
            </>
          )}

          {isLoggedIn && userRole === "1" && (
            <>
              <li>
                <p onClick={() => handleProtectedLink("/admin-dashboard")}>
                  Admin Dashboard
                </p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/admin-userslist")}>
                  Users List
                </p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/admin-whatsapp-bot")}>
                  WhatsApp Bot Control
                </p>
              </li>
              <li>
                <p onClick={() => handleProtectedLink("/admin-settings")}>
                  Admin Settings
                </p>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Auth Buttons */}
      <div className="navbar-actions">
        {!isLoggedIn ? (
          <>
            <Link to="/signin">
              <button className="login-btn">Login</button>
            </Link>
            <Link to="/signup">
              <button className="signup-btn">Sign Up</button>
            </Link>
          </>
        ) : (
          <p className="logout-btn" onClick={handleLogout}>
            Logout
          </p>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
