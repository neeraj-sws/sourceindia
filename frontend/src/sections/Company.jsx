import React from "react";

const Company = () => {
  // 10 items ka dummy array banate hain
  const companies = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    img: "/company.jpg",
  }));

  return (
    <>
      <section className="companySection py-5 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>FEATURED COMPANIES</h1>
          </div>

          <div className="companyGrid">
            <div className="row gx-3">
              {companies.map((item) => (
                <div className="col-md-2 mb-3">
                  <a href="javascript:void(0);" className="d-block h-100">
                    <div key={item.id} className="companyBox px-3 py-4 bg-white border h-100 d-flex align-items-center">
                      <div className="ComImg">
                        <img src={item.img} alt="company" className="img-fluid p-3" />
                      </div>
                    </div>
                  </a>
                </div>
              ))}
              <div className="col-md-2 mb-3">
                <a href="javascript:void(0);" className="d-block h-100">
                  <div className="companyBox px-3 py-4 bg-white border text-center h-100">
                    <div className="ComImg">
                      <img src="/morecompany.jpg" alt="company" className="img-fluid p-3" />
                      <p>More Companies</p>
                    </div>
                  </div>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section >
    </>
  );
};

export default Company;
