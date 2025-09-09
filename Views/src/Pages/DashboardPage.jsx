import React from "react";
import "./styles/DashboardPage.css";

function DashboardPage() {
  return (
    <div className="dashboard-container">
      <h1>📊 Dashboard</h1>

      <div className="dashboard-cards">
        <div className="card">
          <h2>Total Campaigns</h2>
          <p>12</p>
        </div>

        <div className="card">
          <h2>Messages Sent</h2>
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

export default DashboardPage;
