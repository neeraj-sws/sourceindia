import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageFront from "../admin/common/ImageFront";

const Category = ({isHome, limit}) => {

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1&limit=${limit}`);
        const filtered = res.data.filter(cat => cat.product_count !== 0);
        setCategories(filtered);
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
        {isHome &&
        <div className="text-center mt-3"><Link to="/categories" className="btn btn-primary">View All Categories</Link></div>
        }
      </section>



    </>
  );
};

export default Category;
