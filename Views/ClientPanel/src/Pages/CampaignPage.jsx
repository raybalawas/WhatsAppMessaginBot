import React, { useState } from "react";
import "./styles/campaign.css";

export default function CampaignPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    message: "",
    csvfile: null,
    design: null,
    numbersCount: 0,
    previewNumbers: [],
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [creativeProgress, setCreativeProgress] = useState(0);
  const [creativePreview, setCreativePreview] = useState(null);

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;

    if (type === "file") {
      const file = files[0];
      if (!file) return;

      // --- CSV Upload ---
      if (name === "csvfile" && file.name.endsWith(".csv")) {
        setLoading(true);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          const preview = lines.slice(0, 5);

          let p = 0;
          const interval = setInterval(() => {
            p += 20;
            if (p >= 100) {
              clearInterval(interval);
              setProgress(100);
              setLoading(false);
              setFormData((prev) => ({
                ...prev,
                csvfile: file,
                numbersCount: lines.length,
                previewNumbers: preview,
              }));
            } else {
              setProgress(p);
            }
          }, 300);
        };
        reader.readAsText(file);
      }

      // --- Creative Upload ---
      else if (name === "design") {
        setCreativeProgress(0);
        setFormData((prev) => ({ ...prev, design: file }));

        const reader = new FileReader();

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setCreativeProgress(percent);
          }
        };

        reader.onloadend = () => {
          setCreativeProgress(100);
          const fileURL = URL.createObjectURL(file);

          if (file.type.startsWith("image/")) {
            setCreativePreview(
              <img
                src={fileURL}
                alt="Creative Preview"
                style={{
                  maxHeight: "200px",
                  borderRadius: "8px",
                  marginTop: "12px",
                }}
              />
            );
          } else if (file.type.startsWith("video/")) {
            setCreativePreview(
              <video
                src={fileURL}
                controls
                style={{
                  maxHeight: "200px",
                  borderRadius: "8px",
                  marginTop: "12px",
                }}
              />
            );
          } else if (file.type === "application/pdf") {
            setCreativePreview(
              <embed
                src={fileURL}
                type="application/pdf"
                width="100%"
                height="200px"
                style={{ borderRadius: "8px", marginTop: "12px" }}
              />
            );
          } else {
            setCreativePreview(
              <p style={{ color: "red" }}>❌ Preview not available</p>
            );
          }
        };

        reader.readAsDataURL(file);
      } else {
        setFormData((prev) => ({ ...prev, [name]: file }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🚀 Campaign Submitted", formData);
    // TODO: API call to backend
  };

  return (
    <div className="campaign-container">
      <div className="campaign-card">
        {/* -------- Left Section: Form -------- */}
        <div>
          {/* Steps Progress */}
          <div className="steps">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="step">
                <div
                  className={`step-circle ${step >= s ? "active" : "inactive"}`}
                >
                  {s}
                </div>
                <p className="step-label">
                  {s === 1 && "Upload Numbers"}
                  {s === 2 && "Write Message"}
                  {s === 3 && "Upload Creative"}
                  {s === 4 && "Launch"}
                </p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <label>Upload Numbers (CSV)</label>
                <input
                  type="file"
                  name="csvfile"
                  accept=".csv"
                  onChange={handleChange}
                  required
                />
                {loading && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p>Processing CSV... {progress}%</p>
                  </div>
                )}
                {formData.numbersCount > 0 && !loading && (
                  <div>
                    <p className="success-text">
                      ✅ {formData.numbersCount} numbers detected
                    </p>
                    <div className="preview-box">
                      <p>Preview (first 5 numbers):</p>
                      <ul>
                        {formData.previewNumbers.map((num, i) => (
                          <li key={i}>{num}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <label>Campaign Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your WhatsApp message..."
                  required
                />
              </div>
            )}

            {step === 3 && (
              <div>
                <label>Upload Creative (optional)</label>
                <input
                  type="file"
                  name="design"
                  accept="image/*,.pdf,.mp4"
                  onChange={handleChange}
                />

                {/* Progress bar for creative */}
                {creativeProgress > 0 && creativeProgress < 100 && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${creativeProgress}%` }}
                      ></div>
                    </div>
                    <p>Uploading Creative... {creativeProgress}%</p>
                  </div>
                )}

                {creativePreview && (
                  <div className="preview-box">{creativePreview}</div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <h2>✅ Ready to Launch!</h2>
                <p>Review your campaign details in the preview panel →</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-buttons">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-back"
                >
                  ⬅ Back
                </button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-next"
                >
                  Next ➡
                </button>
              ) : (
                <button type="submit" className="btn-launch">
                  🚀 Launch Campaign
                </button>
              )}
            </div>
          </form>
        </div>

        {/* -------- Right Section: Live Preview -------- */}
        <div className="preview-panel">
          <h2>📋 Preview</h2>
          <p>
            <strong>CSV File:</strong>{" "}
            {formData.csvfile ? formData.csvfile.name : "No file uploaded"}
          </p>
          {formData.numbersCount > 0 && (
            <p className="success-text">
              ✅ {formData.numbersCount} numbers detected
            </p>
          )}
          {formData.previewNumbers.length > 0 && (
            <div>
              <p>Numbers Preview:</p>
              <ul>
                {formData.previewNumbers.map((num, i) => (
                  <li key={i}>{num}</li>
                ))}
              </ul>
            </div>
          )}
          <p>
            <strong>Message:</strong>{" "}
            {formData.message || "No message written"}
          </p>
          <p>
            <strong>Creative:</strong>{" "}
            {formData.design ? formData.design.name : "No creative uploaded"}
          </p>

          {/* Creative progress bar in right panel too */}
          {creativeProgress > 0 && creativeProgress < 100 && (
            <div className="mt-3">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${creativeProgress}%` }}
                ></div>
              </div>
              <p>Uploading Creative... {creativeProgress}%</p>
            </div>
          )}

          {creativePreview && (
            <div className="preview-box">{creativePreview}</div>
          )}
          <div className="secure-text">
            🔒 Your data is secure & confidential.
          </div>
        </div>
      </div>
    </div>
  );
}
