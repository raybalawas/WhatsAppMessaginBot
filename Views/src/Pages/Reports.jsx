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
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (res.ok) {
          setReports(data.data);
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
    const res = await fetch(url, { method: "GET" });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  return (
    <div className="main-content">
      <div className="reports-container">
        <h1>📊 Reports</h1>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Message</th>
                <th>Created At</th>
                <th>Download Report</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id}>
                  <td data-label="ID">
                    <span>{report._id}</span>
                  </td>

                  <td data-label="Message">
                    {expanded === report._id ? (
                      <>
                        <p>{report.message}</p>
                        <a
                          className="toggle-btn"
                          onClick={() => setExpanded(null)}
                        >
                          Show Less ▲
                        </a>
                      </>
                    ) : (
                      <>
                        <p>
                          {report.message.length > 100
                            ? report.message.substring(0, 100) + "..."
                            : report.message}
                        </p>
                        {report.message.length > 100 && (
                          <a
                            className="toggle-btn"
                            onClick={() => setExpanded(report._id)}
                          >
                            Show More ▼
                          </a>
                        )}
                      </>
                    )}
                  </td>

                  <td data-label="Created At">
                    {new Date(report.createdAt).toLocaleString()}
                  </td>

                  <td data-label="Download Report">
                    {report.generatedFile ? (
                      // <a href={report.generatedFile}>⬇️ Download Report</a>
                      <button
                        onClick={() =>
                          handleDownload(
                            report.generatedFile,
                            `report-${report.messageId._id}.pdf`
                            // report._id
                          )
                        }
                      >
                        ⬇️ Download Report
                      </button>
                    ) : (
                      <span>No file</span>
                    )}
                  </td>
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
