import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/StatusPage.css";

function StatusPage() {
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
          setError("You must be logged in to see campaigns.");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `http://localhost:3000/api/users/reports/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data && res.data.reports) {
          setReports(res.data.reports);
        } else {
          setError("No reports found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDownload = async (url, fileName) => {
    const res = await fetch(url, { method: "GET" });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  return (
    <div className="status-container">
      <a href="/campaign">Add Campaigns</a>

      <h1>🚦 Campaign Reports</h1>

      {loading && <p>Loading reports...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && reports.length === 0 && <p>No reports found...</p>}

      {!loading && !error && reports.length > 0 && (
        <div className="status-table-container">
          <table className="status-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Message</th>
                <th>CSV File</th>
                <th>Design File</th>
                <th>Status</th>
                <th>Numbers Count</th>
                <th>Sent Count</th>
                <th>Campaign Created</th>
                <th>Report Created</th>
                <th>Download Report</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>

                  {/* Message with expand/collapse */}
                  <td className="message-col">
                    {expanded === item._id ? (
                      <>
                        <p>{item.message}</p>
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
                          {item.message.length > 100
                            ? item.message.substring(0, 100) + "..."
                            : item.message}
                        </p>
                        {item.message.length > 100 && (
                          <button
                            className="toggle-btn"
                            onClick={() => setExpanded(item._id)}
                          >
                            Show More ▼
                          </button>
                        )}
                      </>
                    )}
                  </td>

                  {/* CSV File */}
                  <td>
                    {item.csvFilePath ? (
                      <a
                        href={item.csvFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        CSV File
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Design File */}
                  <td>
                    {item.anyDesignFile ? (
                      <a
                        href={item.anyDesignFile}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Design
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`status ${item.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {item.status || "—"}
                    </span>
                  </td>

                  {/* Numbers Count */}
                  <td>{item.numbersCount ?? "—"}</td>

                  {/* Sent Count */}
                  <td>{item.sentCount ?? "—"}</td>

                  {/* Campaign Created */}
                  <td>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>

                  {/* Report Created */}
                  <td>
                    {item.StatusId?.createdAt
                      ? new Date(item.StatusId?.createdAt).toLocaleString(
                          "en-IN",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        )
                      : "—"}
                  </td>
                  {/* Download Report */}
                  <td>
                    {item.generatedFile ? (
                      <button
                        onClick={() =>
                          handleDownload(
                            item.generatedFile,
                            // `report-${item.StatusId?._id || item._id}.pdf`
                            `report-${item.StatusId._id}.pdf`
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StatusPage;
