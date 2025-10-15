import React from "react";

const Category = () => {
  // 10 items ka dummy array banate hain
  const categories = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Electro Mechanical Components ${i + 1}`,
    img: "/cate.webp",
  }));

  return (
    <>
      <section className="categorySection py-4 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>Trending Categories</h1>
          </div>

          <div className="categoriesGrid justify-content-center">
            {categories.map((item) => (
              <div key={item.id} className="cateBox text-center">
                <div className="cateImg mb-3">
                  <img src={item.img} alt={item.name} />
                  <span className="countspan">{item.id}</span>
                </div>
                <p className="mb-1">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Category;
