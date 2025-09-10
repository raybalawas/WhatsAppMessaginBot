import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SIGNIN_ENDPOINT } from "../../../utils/apiConfig.js";
import "./styles/Signin.css";

function Signin() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch(SIGNIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Signin Response:", data);
      // return false;

      if (res.ok) {
        // Store token + user in localStorage
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("authUser", JSON.stringify(data.data.user));
        localStorage.setItem("authUserId", data.data.user._id);
        // console.log(data.data.user._id);
        // localStorage.setItem("authUserId", data.data._id);
        // alert("authUserId");
        // alert(data.user._id);
        // Redirect
        if (data.data.user.role === "1") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }

        alert("Signin successful!");
        window.location.reload();
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Signin Error:", error);
      setErrorMessage("Network error. Please try again later.");
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h2 className="signin-title">Sign In to Your Account</h2>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label>Username, Email, or Mobile*</label>
            <input
              type="text"
              name="identifier"
              placeholder="Enter your username, email, or mobile"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <small className="helper-text">
              Use your username, registered email, or mobile number.
            </small>
          </div>

          <div className="form-group">
            <label>Password*</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <button type="submit" className="signin-btn">
            Sign In
          </button>
        </form>

        <p className="signin-footer">
          Don’t have an account? <a href="/signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
}

export default Signin;
