import React from "react";
import "../Pages/styles/DashboardPage.css";
function AdminDashboardPage() {
  return (
    <div className="dashboard-container">
      <h1>📊 Admin Dashboard</h1>

      <div className="dashboard-cards">
        <div className="card">
          <h2>Total Merchants</h2>
          <p>12</p>
        </div>

        <div className="card">
          <h2>Total Earning</h2>
          <p>1,245</p>
        </div>

        <div className="card">
          <h2>Active Campaigns</h2>
          <p>5</p>
        </div>

        <div className="card">
          <h2>Pending Campaigns</h2>
          <p>3</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
