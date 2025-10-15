import React from "react";

const Product = () => {
  // 10 items ka dummy array banate hain
  const categories = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Interference Suppression Capacitors Class X2 (UL and ENEC Approved) ${i + 1}`,
    img: "/cate.webp",
  }));

  return (
    <>
      <section className="productSection py-5 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>Latest Product</h1>
          </div>

          <div className="productGrid">
            <div className="row">
              {categories.map((item) => (
                <div className="col-lg-4 col-md-3 col-sm-6 mb-4">
                  <div key={item.id} className="productBox p-3 bg-white">
                    <div className="cateproduct">
                      <p>Electro Mechanical Components</p>
                    </div>
                    <div className="middlepro">
                      <div className="ProImg">
                        <img src={item.img} alt={item.name} />

                      </div>
                      <div className="productlink">
                        <p className="mb-0">{item.name}</p>
                        <a href="javascript:void(0);" className="d-inline-block pt-2"><span className="pe-2">View</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"></path></svg></a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Product;
