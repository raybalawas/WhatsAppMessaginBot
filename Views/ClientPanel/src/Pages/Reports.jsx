import React, { useState, useEffect } from "react";
import "./styles/Reports.css";

function Reports() {
  const [reports, setReports] = useState([]);

  // Fetch dummy reports (later you can replace with API)
  useEffect(() => {
    const dummyReports = [
      {
        id: 1,
        title: "Campaign 1",
        date: "2025-09-08",
        status: "Completed",
        clicks: 120,
        messages: 500,
      },
      {
        id: 2,
        title: "Campaign 2",
        date: "2025-09-07",
        status: "Pending",
        clicks: 45,
        messages: 230,
      },
      {
        id: 3,
        title: "Campaign 3",
        date: "2025-09-05",
        status: "In Progress",
        clicks: 78,
        messages: 300,
      },
    ];
    setReports(dummyReports);
  }, []);

  return (
    <div class="main-content">
      <div className="reports-container">
        <h1>📊 Reports</h1>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Campaign Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Clicks</th>
                <th>Messages Sent</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td data-label="ID">{report.id}</td>
                  <td data-label="Campaign Name">{report.title}</td>
                  <td data-label="Date">{report.date}</td>
                  <td data-label="Status">
                    <span
                      className={`status ${report.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td data-label="Clicks">{report.clicks}</td>
                  <td data-label="Messages Sent">{report.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
