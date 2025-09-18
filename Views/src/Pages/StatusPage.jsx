import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/StatusPage.css";

function StatusPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // 👈 track expanded row

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("authUserId");

        if (!token || !userId) {
          setError("You must be logged in to see campaigns.");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `http://localhost:3000/api/users/camp-status/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data && res.data.Data) {
          setCampaigns(res.data.Data);
        } else {
          setError(res.data.Data.Message, "No campaigns found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch campaigns.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div className="status-container">
      <h1>🚦 Campaign Status</h1>

      {loading && <p>Loading campaigns...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && campaigns.length === 0 && (
        <p>No campaigns found.</p>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="status-table-container">
          <table className="status-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Message</th>
                <th>CSV File</th>
                <th>Design File</th>
                <th>Status</th>
                <th>Numbers Count</th>
                <th>Sent Count</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((item, index) => (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td data-label="Message" className="message-col">
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
                  <td>
                    <span
                      className={`status ${item.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{item.numbersCount}</td>
                  <td>{item.sentCount}</td>
                  <td>
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
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
