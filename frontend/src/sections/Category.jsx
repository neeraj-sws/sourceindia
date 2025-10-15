import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import React, { useEffect, useState } from 'react';
import ImageFront from "../admin/common/ImageFront";

const Category = () => {

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?limit=6`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <section className="categorySection py-4 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>Trending Categories</h1>
          </div>

          <div className="categoriesGrid justify-content-center">
            {categories.map((cat) => (
              <div key={cat.id} className="cateBox text-center">
                <div className="cateImg mb-3">

                  <ImageFront
                    src={`${ROOT_URL}/${cat.file_name}`}
                    width={180}
                    height={180}
                    showFallback={true}
                  />
                  <span className="countspan">{cat.product_count || 0}</span>
                </div>
                <p className="mb-1">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



    </>
  );
};

export default Category;
