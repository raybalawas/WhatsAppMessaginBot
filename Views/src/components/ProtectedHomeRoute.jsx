import { Navigate } from "react-router-dom";

function ProtectedHomeRoute({ children }) {
  const token = localStorage.getItem("authToken");

  // If user is logged in, redirect to /dashboard or /admin-dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // Else allow access to Home page
  return children;
}

export default ProtectedHomeRoute;
