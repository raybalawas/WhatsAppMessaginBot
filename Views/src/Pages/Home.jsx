import React from "react";
import "./styles/Home.css";
import { Link } from "react-router-dom";
import PaymentPlans from "../components/PaymentPlans";

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>🚀 Send Bulk WhatsApp Messages with Ease</h1>
        <p>
          Manage your campaigns, reach thousands of customers, and share offers
          instantly. Grow your business with our WhatsApp Messaging Panel.
        </p>
        <button className="cta-btn">Get Started</button>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📤 Bulk Messaging</h3>
            <p>
              Upload your contact list and send personalized messages to
              thousands of users at once.
            </p>
          </div>
          <div className="feature-card">
            <h3>📊 Campaign Management</h3>
            <p>
              Track delivery status, check reports, and analyze your campaigns
              in real time.
            </p>
          </div>
          <div className="feature-card">
            <h3>📎 Media Support</h3>
            <p>
              Share images, PDFs, or videos with your audience to make your
              message more impactful.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="subscription-plans">
        {/* <h2>💳 Subscription Plans</h2>
        <div className="plans-grid">
          <div className="plan-card">
            <h3>Basic</h3>
            <p className="price">₹499 / month</p>
            <ul>
              <li>✔ 1,000 Messages</li>
              <li>✔ Basic Campaign Reports</li>
              <li>✔ Email Support</li>
            </ul>
            <button className="plan-btn">Choose Plan</button>
          </div>

          <div className="plan-card popular">
            <h3>Pro</h3>
            <p className="price">₹999 / month</p>
            <ul>
              <li>✔ 5,000 Messages</li>
              <li>✔ Advanced Reports</li>
              <li>✔ Priority Support</li>
            </ul>
            <button className="plan-btn">Choose Plan</button>
          </div>

          <div className="plan-card">
            <h3>Enterprise</h3>
            <p className="price">₹1999 / month</p>
            <ul>
              <li>✔ 20,000 Messages</li>
              <li>✔ Full Analytics</li>
              <li>✔ Dedicated Account Manager</li>
            </ul>
            <button className="plan-btn">Choose Plan</button>
          </div>
        </div> */}
        <div>
          <PaymentPlans />
        </div>
      </section>

      {/* Offers / Promo Section */}
      <section className="offers">
        <h2>🔥 Special Offer</h2>
        <p>
          Sign up today and get <strong>100 free WhatsApp messages</strong> to
          try our service.
        </p>

        {/* <p onClick={() => handleProtectedLink("/signup")}> */}
        <Link to="/signup">
          <button className="cta-btn">Claim Offer</button>
        </Link>
        {/* </p> */}
      </section>
    </div>
  );
}

export default Home;
