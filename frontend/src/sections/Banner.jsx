import React, { useEffect, useState } from 'react'
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";

const Banner = () => {

  const [homeBanner, setHomeBanner] = useState([]);

  useEffect(() => {
    const fetchHomeBanner = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/home_banners`);
        setHomeBanner(res.data);
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
                  <img
                    src={`${ROOT_URL}/${slider.file_name}`}
                    className="d-block w-100 object-fit-cover d-none"
                    alt={slider.title}
                    height={500}
                  />
                  <img
                    src="http://localhost:5000/v2/upload/home_banners/1760508363325.jpg"
                    className="d-block w-100 object-fit-cover"
                    alt={slider.title}
                    height={500}
                  />
                  <div className="overlay" />
                  <div className="carousel-caption d-none">
                    <h2>{slider.title}</h2>
                    <p>{slider.sub_title}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true" />
              <span className="visually-hidden">Previous</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true" />
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </div>
      </div >
    </>
  );
};

export default Banner;