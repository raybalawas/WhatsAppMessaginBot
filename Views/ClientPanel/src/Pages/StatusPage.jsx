import React from "react";
import "./styles/StatusPage.css";

function StatusPage() {
  const statusData = [
    { id: 1, campaign: "Campaign 1", date: "2025-09-08", status: "Completed" },
    { id: 2, campaign: "Campaign 2", date: "2025-09-07", status: "Pending" },
    {
      id: 3,
      campaign: "Campaign 3",
      date: "2025-09-05",
      status: "In Progress",
    },
  ];

  return (
    <div className="status-container">
      <h1>🚦 Campaign Status</h1>
      <div className="status-table-container">
        <table className="status-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Campaign Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {statusData.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.campaign}</td>
                <td>{item.date}</td>
                <td>
                  <span
                    className={`status ${item.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatusPage;
