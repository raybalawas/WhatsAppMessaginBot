import React, { useState } from "react";
import "./PaymentPlans.css"; // external styles

function PaymentPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 499,
      features: ["1,000 Messages", "Basic Campaign Reports", "Email Support"],
    },
    {
      id: "pro",
      name: "Pro",
      price: 999,
      features: ["5,000 Messages", "Advanced Reports", "Priority Support"],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 1999,
      features: [
        "20,000 Messages",
        "Full Analytics",
        "Dedicated Account Manager",
      ],
    },
  ];

  return (
    <div className="plans-wrapper">
      {/* Title */}
      <h1 className="plans-title">💳 Payment & Subscription Plans</h1>

      {/* Payment Policy Section */}
      <div className="payment-policy">
        <h2>Payment Policy</h2>
        <ul>
          <li>✅ No upfront payment is required</li>
          <li>
            ✅ Initial payment after successful delivery of{" "}
            <strong>20–30%</strong> of the WhatsApp numbers provided
          </li>
          <li>
            ✅ Upon receiving full payment, we will deliver the campaign to{" "}
            <strong>all of your numbers</strong>.
          </li>
        </ul>
        <button className="pay-btn">Make Payment</button>
      </div>

      {/* Plans Section */}
      <h2 className="choose-heading">📦 Choose Your Plan</h2>
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${
              selectedPlan === plan.id ? "selected" : ""
            } ${plan.popular ? "popular" : ""}`}
          >
            {plan.popular && <div className="badge">Most Popular</div>}
            <h3>{plan.name}</h3>
            <p className="price">₹{plan.price} / month</p>
            <ul>
              {plan.features.map((feature, index) => (
                <li key={index}>✔ {feature}</li>
              ))}
            </ul>
            <button
              className="choose-btn"
              onClick={() => setSelectedPlan(plan.id)}
            >
              {selectedPlan === plan.id ? "Selected ✅" : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentPlans;
