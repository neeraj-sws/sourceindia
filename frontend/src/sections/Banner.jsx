import React, { useEffect, useState } from 'react'
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";
import { Link } from 'react-router-dom';

const Banner = () => {

  const [homeBanner, setHomeBanner] = useState([]);

  useEffect(() => {
    const fetchHomeBanner = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/home_banners`);
        const filtered = res.data.filter(slider => slider.status == 1 && slider.is_delete == 0);
        setHomeBanner(filtered);
      } catch (err) {
        console.error("Error fetching home banners:", err);
      }
    };
    fetchHomeBanner();
  }, []);


  return (
    <>
      <div className="mainBanner">
        <div className="bgCarouselImg">
          <div id="carouselExampleCaptions" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner">
              {homeBanner.map((slider, index) => (
                <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={slider.id || index}>
  <div
    className="banner-slide"
    style={{
      backgroundImage: `url(${ROOT_URL}/${slider.file_name})`
    }}
  >
    <div className="banner-overlay" />

    <div className="container h-100">
      <div className="row h-100 align-items-center">
        <div className="col-md-7 banner-content">
          {slider.title && <h1>{slider.title}</h1>}
          {slider.sub_title && <h4>{slider.sub_title}</h4>}
          {slider.description && (
            <p dangerouslySetInnerHTML={{ __html: slider.description }} />
          )}
          {slider.button_text && (
            <a
              href={slider.button_url || "#"}
              className="btn btn-outline-light mt-3"
              target="_blank"
              rel="noreferrer"
            >
              {slider.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
              ))}
            </div>

            {homeBanner.length > 1 && (
              <>
                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#carouselExampleCaptions"
                  data-bs-slide="prev"
                >
                  <span className="carousel-control-prev-icon" aria-hidden="true" />
                  <span className="visually-hidden">Previous</span>
                </button>

                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#carouselExampleCaptions"
                  data-bs-slide="next"
                >
                  <span className="carousel-control-next-icon" aria-hidden="true" />
                  <span className="visually-hidden">Next</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default Banner;