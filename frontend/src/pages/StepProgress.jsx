import React, { useEffect, useState, useRef } from "react";
import UseAuth from "../sections/UseAuth";

const StepProgress = () => {
  const { user } = UseAuth();
  const progressRef = useRef(null);
  const [currentActive, setCurrentActive] = useState(1);

  // --- Set step based on user data ---
  useEffect(() => {
    if (user) {
      let step = 1;
      if (user.is_profile && user.is_company && user.is_product) step = 4;
      else if (user.is_profile && user.is_company) step = 3;
      else if (user.is_profile) step = 2;
      setCurrentActive(step);
    }
  }, [user]);

  // --- Animate progress line ---
  useEffect(() => {
    const circles = document.querySelectorAll(".circle");
    const progress = progressRef.current;

    circles.forEach((circle, idx) => {
      if (idx < currentActive) {
        circle.classList.add("active");
      } else {
        circle.classList.remove("active");
      }
    });

    if (progress) {
      progress.style.width =
        ((currentActive - 1) / (circles.length - 1)) * 100 + "%";
    }
  }, [currentActive]);

  return (
    <div className="progress-container py-3">
      {/* Green progress line */}
      <div className="progress" ref={progressRef}></div>

      {/* Steps */}
      <div className="steps">
        <div className={`circle ${currentActive >= 1 ? "active" : ""}`}>

          <i class="lni lni-envelope"></i>



          <div className="caption">Email Verify</div>
        </div>

        <div className={`circle ${currentActive >= 2 ? "active" : ""}`}>


          <i class="bx bx-user"></i>

          <div className="caption">Profile</div>
        </div>

        <div className={`circle ${currentActive >= 3 ? "active" : ""}`}>

          <i class="lni lni-apartment"></i>
          <div className="caption">Company</div>
        </div>

        <div className={`circle ${currentActive >= 4 ? "active" : ""}`}>
          <i class="bx bx-cart ms-auto"></i>
          <div className="caption">Product</div>
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
