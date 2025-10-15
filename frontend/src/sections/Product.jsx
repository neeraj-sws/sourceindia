import API_BASE_URL, { ROOT_URL } from "./../config";
import React, { useEffect, useState } from 'react';
import ImageFront from "../admin/common/ImageFront";
import axios from "axios";

const Product = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products?is_delete=0&status=1&is_approve=1&limit=6`);
        setProducts(res.data.products);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchProducts();
  }, []);



  return (
    <>
      <section className="productSection py-5 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>Latest Product</h1>
          </div>

          <div className="productGrid">
            <div className="row">
              {products.map((product) => (
                <div className="col-lg-4 col-md-3 col-sm-6 mb-4">
                  <div key={product.id} className="productBox p-3 bg-white">
                    <div className="cateproduct">
                      <p>{product.category_name}</p>
                    </div>
                    <div className="middlepro">
                      <div className="ProImg">
                        <ImageFront
                          src={`${ROOT_URL}/${product.file_name}`}
                          width={180}
                          height={180}
                          showFallback={true}
                        />
                      </div>
                      <div className="productlink">
                        <p className="mb-0">{product.title}</p>
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
