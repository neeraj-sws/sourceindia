import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./../config";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/membership_plans?is_delete=0`)
      .then((res) => {
        setPlans(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Group plans by name (TRIAL, SILVER, GOLD, DIAMOND)
  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.name]) {
      acc[plan.name] = {
        ...plan,
        memberPrice: null,
        nonMemberPrice: null,
      };
    }

    if (plan.elcina_plan === "1") {
      acc[plan.name].memberPrice = plan.price;
    } else {
      acc[plan.name].nonMemberPrice = plan.price;
    }

    return acc;
  }, {});

  return (
    <section className="my-5">
      <div className="container">
        <div className="card mb-5 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">Elcina Portal Subscription Plans</h1>
            </div>
          </div>
        </div>
        <div className="planBox">
          <div className="row">
            <div className="col-lg-12 mx-auto">
              <div className="card">
                <div className="card-body p-5">
    <div className="table-responsive overflow-x-auto">
          <table className="table table-bordered m-auto w-100" border="1" cellspacing="15">              
            <thead><tr className="">              
              <th rowspan="1">Plan Name</th>
              <th colspan="3">Features</th>
              <th rowspan="2">Validity</th>
              <th colspan="2">Price(Excluding GST)</th>
            </tr>
            <tr className="second_row">             
              <th></th>
              <th>No. of Enquiries</th>
              <th>Product Categories</th>
              <th>No. of Product</th>
              <th>Member</th>
              <th>Non-Member</th>
            </tr>
            </thead>
<tbody>
            {Object.values(groupedPlans).map((plan) => (
                    <tr key={plan.name}>
                      <td className="text-start">{plan.name}</td>
                      <td>{plan.enquiries}</td>
                      <td>{plan.category}</td>
                      <td>{plan.product}</td>
                      <td>{plan.expire_days === 365 ? "1 Year" : `${plan.expire_days} Days`}</td>
                      <td>
                        {plan.memberPrice > 0 ? (
                          <div className="planpart">
                            <img src="/scroll-down.gif" alt="drag-right.gif" className="gif_left" />
                            ₹{plan.memberPrice} <a href="javascript:void(0);" className="continuebtn" onClick={() => getPlan(plan.id)}>Continue</a>
                          </div>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td>
                        {plan.nonMemberPrice > 0 ? (
                          <div className="planpart">
                            <img src="/scroll-down.gif" alt="drag-right.gif" className="gif_left" />
                            ₹{plan.nonMemberPrice}
                            <a href="javascript:void(0);" className="continuebtn" onClick={() => getPlan(plan.id)}>Continue</a>
                          </div>
                        ) : (
                          "0"
                        )}
                      </td>
                    </tr>
                  ))}
                  </tbody></table>
            </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    </section>
  )
}

export default SubscriptionPlans