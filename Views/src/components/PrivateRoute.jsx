import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("authUser");
  const parsedUser = user ? JSON.parse(user) : null;
  const role = parsedUser ? parsedUser.role : null;

  if (!token || role === null) {
    alert("⚠ You must be logged in to access this page.");
    return <Navigate to="/signin" />;
  }

  if (!allowedRoles.includes(role)) {
    // alert("🚫 You do not have permission to access this page.");
    if (role === "1") {
      return <Navigate to="/admin-dashboard" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;
