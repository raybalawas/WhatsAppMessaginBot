import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Navbar.css";
import logo from "../assets/zerfinislogo.png";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 0 = user, 1 = superadmin
  const navigate = useNavigate();

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");
    if (token && user) {
      const parsedUser = JSON.parse(user);
      setIsLoggedIn(true);
      setUserRole(parsedUser.role); // Assuming role is stored in authUser
    } else {
      setIsLoggedIn(false);
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
  // Guarded navigation
  const handleProtectedLink = (path) => {
    if (isLoggedIn) {
      navigate(path);
    } else {
      alert("You must be logged in to access this page.");
      navigate("/signin");
    }
  };
  const handleHomePage = (path) => {
    if (!isLoggedIn) {
      navigate(path);
    } else {
      alert("You must be logged out to access this page.");
      // navigate("/signin");
      navigate("/admin-dashboard");
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
          {isLoggedIn === true ||
            (isLoggedIn === false && userRole !== "1" && (
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
                  <p onClick={() => handleProtectedLink("/setting")}>
                    Settings
                  </p>
                </li>
              </>
            ))}

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
