import React, { useState, useEffect } from "react";
import "../pages/styles/Reports.css";
import {
  USER_LIST_ENDPOINT,
  USER_PROFILE_UPDATE_ENDPOINT,
} from "../../../utils/apiConfig";
import { useNavigate } from "react-router-dom";

function Clients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Send token for protected API

        const res = await fetch(USER_LIST_ENDPOINT, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setUsers(data.data);
        } else {
          setErrorMessage(data.message || "Failed to fetch users.");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setErrorMessage("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (userId) => {
    console.log("Edit user:", userId);
    // Example: navigate to edit page
    navigate(`/admin/edit-user/${userId}`);
  };
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("authToken");

    const updatedStatus = user.status === "1" ? "0" : "1"; // Toggle status

    try {
      const res = await fetch(`${USER_PROFILE_UPDATE_ENDPOINT}/${user._id}`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: updatedStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Status updated successfully!");
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === user._id ? { ...u, status: updatedStatus } : u
          )
        );
      } else {
        alert(data.message || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Network error. Please try again later.");
    }
  };

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${USER_LIST_ENDPOINT}/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert("User deleted successfully");
        setUsers(users.filter((user) => user._id !== userId));
      } else {
        alert(data.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error. Please try again later.");
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (errorMessage) return <div className="error">{errorMessage}</div>;

  return (
    <div className="main-content">
      <div className="reports-container">
        <h1>📊 Merchants / Clients</h1>

        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>User Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                {/* <th>Status</th> */}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td data-label="ID">{user._id}</td>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Username">{user.userName}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Mobile">{user.mobile}</td>
                  <td data-label="Role">
                    {user.role === "1" ? "Super Admin" : "User"}
                  </td>
                  <td data-label="Action">
                    <button className="camp-btn">Campaigns</button>
                    <button
                      className={`status-toggle-btn ${
                        user.status === "1" ? "active" : "inactive"
                      }`}
                      onClick={() => handleToggleStatus(user)}
                    >
                      {user.status === "1" ? "Active" : "Inactive"}
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(user._id)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </button>
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

export default Clients;
