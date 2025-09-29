import React, { useState, useEffect } from "react";
import "./styles/Reports.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("authUserId");

        if (!token || !userId) {
          setError("Not logged in or missing credentials.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:3000/api/users/reports/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            method: "GET",
          }
        );

        const data = await res.json();
        console.log("Fetched reports:", data);

        if (res.ok) {
          // setReports(data.data || []);
          setReports(data.reports || []);
        } else {
          setError(data.message || "Failed to fetch reports.");
        }
      } catch (err) {
        setError("Something went wrong: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <p>Loading reports...</p>;
  if (error) return <p className="error">{error}</p>;

  const handleDownload = async (url, fileName) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  return (
    <div className="main-content">
      <div className="reports-container">
        <h1>📊 Campaign Reportss</h1>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>S.no.</th>
                <th>Message</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Download Report</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="5">No reports found.</td>
                </tr>
              ) : (
                reports.map((report, index) => {
                  const status = report.status || "pending";
                  const statusData = report.statusId || {};
                  const createdAt =
                    statusData.createdAt || report.createdAt || null;

                  return (
                    <tr key={report._id}>
                      <td>{index + 1}</td>

                      <td data-label="Message">
                        {expanded === report._id ? (
                          <>
                            <p>{report.message || "No message"}</p>
                            <button
                              className="toggle-btn"
                              onClick={() => setExpanded(null)}
                            >
                              Show Less ▲
                            </button>
                          </>
                        ) : (
                          <>
                            <p>
                              {report.message?.length > 80
                                ? report.message.substring(0, 80) + "..."
                                : report.message || "No message"}
                            </p>
                            {report.message?.length > 80 && (
                              <button
                                className="toggle-btn"
                                onClick={() => setExpanded(report._id)}
                              >
                                Show More ▼
                              </button>
                            )}
                          </>
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {createdAt
                          ? new Date(createdAt).toLocaleString()
                          : "N/A"}
                      </td>

                      <td>
                        {statusData.generatedFile ? (
                          <button
                            onClick={() =>
                              handleDownload(
                                statusData.generatedFile,
                                `report-${statusData._id}.pdf`
                              )
                            }
                          >
                            ⬇️ Download
                          </button>
                        ) : (
                          <span>No file</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
