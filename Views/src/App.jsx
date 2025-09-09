import React from "react";
// import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./layout/Navbar.jsx";
import Home from "./Pages/Home.jsx";
import DashboardPage from "./Pages/DashboardPage.jsx";
import CampaignPage from "./Pages/CampaignPage.jsx";
import StatusPage from "./Pages/StatusPage.jsx";
import SettingsPage from "./Pages/SettingsPage.jsx";
import Reports from "./Pages/Reports.jsx";
import Signup from "./auth/Signup.jsx";
import Signin from "./auth/Signin.jsx";
import NotFoundRedirect from "./pages/NotFoundRedirect.jsx";
import Footer from "./layout/Footer.jsx";
{
  /*Admin Panle url's*/
}
import AdminDashboardPage from "./PagesAdmin/AdminDashboardPage.jsx";
import Clients from "./PagesAdmin/Clients.jsx";
import ProtectedHomeRoute from "./components/ProtectedHomeRoute.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        {/* Define routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />

          {/* User Routes (allowed role "0") */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={["0"]}>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/campaign"
            element={
              <PrivateRoute allowedRoles={["0"]}>
                <CampaignPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/status"
            element={
              <PrivateRoute allowedRoles={["0"]}>
                <StatusPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/setting"
            element={
              <PrivateRoute allowedRoles={["0"]}>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute allowedRoles={["0"]}>
                <Reports />
              </PrivateRoute>
            }
          />

          {/* Admin Routes (allowed role "1") */}
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute allowedRoles={["1"]}>
                <AdminDashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-userslist"
            element={
              <PrivateRoute allowedRoles={["1"]}>
                <Clients />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-whatsapp-bot"
            element={
              <PrivateRoute allowedRoles={["1"]}>
                {/* Your WhatsApp Bot Control Page */}
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-settings"
            element={
              <PrivateRoute allowedRoles={["1"]}>
                {/* Your Admin Settings Page */}
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
