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

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        {/* Define routes */}
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaign" element={<CampaignPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/setting" element={<SettingsPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />

          {/*Admin Panle url's*/}
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />

          {/* Catch-all unknown routes */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
