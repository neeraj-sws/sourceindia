// StepProgress.jsx
import React from "react";

const StepProgress = () => {
  return (
    <div className="step-progress-container">
      <div className="step">
        <div className="step-icon email"></div>
        <span className="step-label">Email Verify</span>
        <span className="step-checkmark">✓</span>
      </div>
      <div className="step">
        <div className="step-icon profile"></div>
        <span className="step-label">Profile</span>
        <span className="step-checkmark">✓</span>
      </div>
      <div className="step">
        <div className="step-icon company"></div>
        <span className="step-label">Company</span>
        <span className="step-checkmark">✓</span>
      </div>
      <div className="step">
        <div className="step-icon product"></div>
        <span className="step-label">Product</span>
        <span className="step-checkmark">✓</span>
      </div>
    </div>
  );
};

export default StepProgress;