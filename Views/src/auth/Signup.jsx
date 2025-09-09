import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Signup.css";
import { SIGNUP_ENDPOINT } from "../../../utils/apiConfig.js";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    email: "",
    mobile: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Success:", data.message);
        alert("Registration successful!");
        navigate("/signin");
      } else {
        console.error("Error:", data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create an Account</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label>Name*</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Username*</label>
            <input
              type="text"
              name="userName"
              placeholder="Choose a username"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email*</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile*</label>
            <input
              type="number"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password*</label>
            <input
              type="password"
              name="password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="signup-btn">
            Sign Up
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <a href="/signin">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
