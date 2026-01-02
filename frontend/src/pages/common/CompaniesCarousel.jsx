import React, { useState, useEffect } from 'react';
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../../admin/common/ImageWithFallback'));
import { ROOT_URL } from '../../config';

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const CompaniesCarousel = ({ companies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setItemsPerSlide(1);
      else if (width < 992) setItemsPerSlide(2);
      else setItemsPerSlide(6);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slides = chunkArray(companies, itemsPerSlide);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (companies.length === 0) return null;

  return (
    <Suspense fallback={<div></div>}>
      <div className="multi-carousel-container my-5">
        <h2 className="text-center mb-4">Featured Companies</h2>
        <div className="carousel-wrapper">
          <button className="carousel-control left" onClick={prevSlide}>
            <i className="bx bx-chevron-left" aria-hidden="true" />
          </button>
          <div className="carousel-viewport">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {slides.map((slide, slideIndex) => (
                <div className="carousel-slide" key={slideIndex}>
                  {slide.map((company) => (
                    <div className="carousel-item-custom" key={company.id}>
                      <ImageWithFallback
                        src={`${ROOT_URL}/${company.company_logo_file}`}
                        width={180}
                        height={180}
                        showFallback={true}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button className="carousel-control right" onClick={nextSlide}>
            <i className="bx bx-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Suspense>
  );
};

export default CompaniesCarousel;
