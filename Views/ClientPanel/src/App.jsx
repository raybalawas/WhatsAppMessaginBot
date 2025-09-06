import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./layout/Navbar.jsx";
import Home from "./Pages/Home.jsx";
import CampaignPage from "./Pages/CampaignPage.jsx";
import Signup from "./auth/Signup.jsx";
import Footer from "./layout/Footer.jsx";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        {/* Define routes */}
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="campaign" element={<CampaignPage />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
