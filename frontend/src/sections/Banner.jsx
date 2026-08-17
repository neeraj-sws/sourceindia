import React, { useEffect, useState } from 'react'
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import ImageWithFallback from '../admin/common/ImageWithFallback';
import Carousel from 'bootstrap/js/dist/carousel';
import HomeCategoryShowcase from '../sections/HomeCategoryShowcase';

const Banner = () => {

  const [homeBanner, setHomeBanner] = useState([]);
  const [searchType, setSearchType] = useState("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [popularCategories, setPopularCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const navigate = useNavigate();

  const normalizeSearchValue = (value = "") =>
    value.toString().replace(/\s+/g, " ").trim();

  useEffect(() => {
    const fetchHomeBanner = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/home_banners`);
        const filtered = res.data.filter(slider => slider.status == 1 && slider.is_delete == 0);
        setHomeBanner(filtered);
      } catch (err) {
        console.error("Error fetching home banners:", err);
      } finally {
        setBannerLoading(false);
      }
    };
    fetchHomeBanner();
  }, []);

  useEffect(() => {
    const imageUrl = homeBanner[0]?.file_name
      ? `${ROOT_URL}/${homeBanner[0].file_name}`
      : null;
    if (!imageUrl) {
      setBgImageLoaded(true);
      return;
    }
    setBgImageLoaded(false);
    const img = new Image();
    img.onload = () => setBgImageLoaded(true);
    img.onerror = () => setBgImageLoaded(true);
    img.src = imageUrl;
  }, [homeBanner.length]);

  useEffect(() => {
    if (!searchFocused || normalizeSearchValue(searchQuery).length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const normalizedQuery = normalizeSearchValue(searchQuery);
        if (!normalizedQuery) {
          setSuggestions([]);
          setShowDropdown(false);
          return;
        }

        const res = await axios.post(
          `${API_BASE_URL}/front_menu/main-search?q=${encodeURIComponent(normalizedQuery)}&type=${searchType}`
        );

        if (cancelled) return;

        setSuggestions(res.data || []);
        setShowDropdown(Array.isArray(res.data) && res.data.length > 0);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchType, searchFocused]);

  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/category-item?is_delete=0&status=1&limit=8&is_home=1`
        );
        setPopularCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching popular categories:", err);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchPopularCategories();
  }, []);

  useEffect(() => {
    const carouselEl = document.getElementById("carouselExampleCaptions");
    if (!carouselEl) return;

    // initialize or re-initialize bootstrap carousel when banners change
    let carouselInstance = Carousel.getInstance(carouselEl);
    if (!carouselInstance) {
      carouselInstance = new Carousel(carouselEl, { interval: 5000, ride: 'carousel' });
    } else {
      carouselInstance.cycle();
    }

    const handleSlide = (e) => {
      setActiveSlideIndex(e.to || 0);
    };

    carouselEl.addEventListener("slid.bs.carousel", handleSlide);
    return () => {
      carouselEl.removeEventListener("slid.bs.carousel", handleSlide);
      try { carouselInstance.dispose(); } catch (e) { }
    };
  }, [homeBanner.length]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const normalizedSearch = normalizeSearchValue(searchQuery);

    if (normalizedSearch.length < 3) {
      alert("Enter Product / Service Keyword(s) at least three characters");
      return;
    }

    const path =
      searchType === "product"
        ? "/products"
        : searchType === "seller"
          ? "/company-list"
          : "/buyer-list";

    navigate(`${path}?search=${encodeURIComponent(normalizedSearch)}`);
  };

  const handleSuggestionClick = (item) => {
    if (!item?.url) return;
    const searchValue = normalizeSearchValue(item.name || "");
    if (!searchValue) return;
    setSearchQuery(searchValue);
    setShowDropdown(false);
    navigate(`${item.url.includes("?") ? `${item.url}&search=${encodeURIComponent(searchValue)}` : `${item.url}?search=${encodeURIComponent(searchValue)}`}`);
  };

  const searchChipIcon = (keyword = "") => {
    const k = keyword.toLowerCase();
    if (k.includes("pcb") || k.includes("board")) return "bx-chip";
    if (k.includes("capacitor")) return "bx-loader-circle";
    if (k.includes("connector") || k.includes("plug")) return "bx-plug";
    if (k.includes("ic") || k.includes("integrated")) return "bx-microchip";
    if (k.includes("power")) return "bx-power-off";
    if (k.includes("resistor")) return "bx-transfer-alt";
    if (k.includes("led") || k.includes("light")) return "bx-bulb";
    if (k.includes("sensor")) return "bx-radar";
    if (k.includes("transformer")) return "bx-infinite";
    if (k.includes("relay")) return "bx-git-merge";
    if (k.includes("battery")) return "bx-battery";
    if (k.includes("motor")) return "bx-rotate-right";
    if (k.includes("switch")) return "bx-toggle-right";
    if (k.includes("cable") || k.includes("wire")) return "bx-cable-car";
    if (k.includes("diode")) return "bx-right-arrow-circle";
    return "bx-search";
  };

  const handlePopularSearch = (value) => {
    const normalizedValue = normalizeSearchValue(value);
    if (!normalizedValue) return;
    setSearchQuery(normalizedValue);
    navigate(`/products?search=${encodeURIComponent(normalizedValue)}`);
  };

  // Right-side search card stays static (not part of the slider) — driven by the first banner only.
  const primaryBanner = homeBanner[0] || {};
  const staticTitle = primaryBanner.title || "Search Electronics Products";
  const staticSubtitle = primaryBanner.sub_title || "Find high quality products, manufacturers, suppliers and service providers";
  const staticPopularSearches = primaryBanner.popular_searches
    ? primaryBanner.popular_searches.split(/,|;/).map((item) => item.trim()).filter(Boolean)
    : ["PCB", "Capacitor", "Connectors", "IC", "Power Supply", "Resistors", "LED", "Sensors"];

  const carouselItems = homeBanner.length > 0
    ? homeBanner
    : [{
        id: 'banner-placeholder',
        description: 'Create Your Business Profile<br>Add Products in Few Clicks<br>Receive Enquiries & Grow Business',
        button_url: '/registration',
        button_text: 'Join as Seller',
      }];

  const bgImageUrl = primaryBanner.file_name
    ? `${ROOT_URL}/${primaryBanner.file_name}`
    : null;

  return (
    <>
      <div className="mainBanner">
        <div className="bgCarouselImg">
          <div
            className="banner-slide"
            style={{
              backgroundImage: bgImageLoaded && bgImageUrl
                ? `url(${bgImageUrl})`
                : 'none',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="banner-overlay" />
            <div className="container-fluid  h-100 px-5">
              <div className="row h-100 align-items-center gy-4 gx-3">

                {/* LEFT: only this box slides */}
                <div className="col-lg-4 col-xxl-4 h-100">
                  <div id="carouselExampleCaptions" className="carousel slide h-100" data-bs-ride="carousel">
                    <div className="carousel-inner h-100">
                      {carouselItems.map((slider, index) => {
                        const leftFeatures = slider.description
                          ? slider.description
                            .split(/<br\s*\/?>|\n|\r/)
                            .map((item) => item.replace(/<[^>]+>/g, "").trim())
                            .filter(Boolean)
                          : ["Create Your Business Profile", "Add Products in Few Clicks", "Receive Enquiries & Grow Business"];

                        return (
                          <div className={`carousel-item h-100 ${index === 0 ? 'active' : ''}`} key={slider.id || `placeholder-${index}`}>
                            <div className="hero-left-card h-100">
                              <div className="hero-card-header mb-3">
                                <span className="hero-slide-counter">{String(activeSlideIndex + 1).padStart(2, '0')}/{String(carouselItems.length || 1).padStart(2, '0')}</span>
                              </div>

                              <h2 className="hero-left-main">
                                <span className="hero-left-normal">
                                  {index === 0 ? "BUY & SOURCE PRODUCTS" : "LIST & SELL PRODUCTS"}
                                </span>
                              </h2>
                              {/* <span className="hero-left-accent">SELL</span>  */}
                              <p className="hero-left-desc  mb-3 w-50">
                                {index === 0
                                ? "Share your requirements and connect with the right sellers."
                                : "List your products and connect with verified buyers across India."}
                              </p>
                              <ul className="hero-feature-list">
                                {leftFeatures.map((feature, idx) => (
                                  <li key={idx}>{feature}</li>
                                ))}
                              </ul>
                              <div className="d-flex flex-wrap gap-2 mt-4">
                                <a
                                  href={slider.button_url || "/registration"}
                                  className="btn btn-primary btn-lg hero-cta"
                                  target={slider.button_url ? "_blank" : "_self"}
                                  rel={slider.button_url ? "noreferrer" : undefined}
                                >
                                  {slider.button_text || "Join as Seller"}
                                </a>
                              </div>
                              {carouselItems.length > 1 && (
                                <div className="hero-slider-dots mt-4">
                                  {carouselItems.map((_, dotIndex) => (
                                    <button
                                      key={`dot-${dotIndex}`}
                                      type="button"
                                      className={`slider-dot ${dotIndex === activeSlideIndex ? "active" : ""}`}
                                      data-bs-target="#carouselExampleCaptions"
                                      data-bs-slide-to={dotIndex}
                                      aria-label={`Slide ${dotIndex + 1}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {carouselItems.length > 1 && (
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

                {/* RIGHT: static, does not slide */}
                <div className="col-lg-8">
                  <div className="hero-search-card">
                    <div className="hero-search-header">
                      <h1>{staticTitle}</h1>
                      <p className="hero-subtitle">{staticSubtitle}</p>
                    </div>
                    <form className="hero-search-form" onSubmit={handleSearchSubmit}>
                      <div className="popularPartbox gap-2">
                        <select
                          className="form-select form-select-lg"
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                        >
                          <option value="product">Products</option>
                          <option value="seller">Seller</option>
                          <option value="buyer">Buyer</option>
                        </select>
                        <div className="position-relative flex-grow-1">
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="Enter product / service name to search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                              setSearchFocused(true);
                              if (searchQuery.length >= 3) setShowDropdown(true);
                            }}
                            onBlur={() => {
                              setSearchFocused(false);
                              setTimeout(() => setShowDropdown(false), 150);
                            }}
                          />
                          {showDropdown && suggestions.length > 0 && (
                            <ul className="search-suggestion-box list-unstyled shadow-sm">
                              {suggestions.map((item) => (
                                <li
                                  key={item.id || item.name}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSuggestionClick(item);
                                  }}
                                  className="search-suggestion-item"
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <i className="bx bx-history" />
                                    {item.name}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                          {searchFocused && normalizeSearchValue(searchQuery).length < 3 && staticPopularSearches.length > 0 && (
                            <ul className="search-suggestion-box list-unstyled shadow-sm">
                              <li className="search-suggestion-heading px-3 pt-2 pb-1 text-muted small">Popular Searches</li>
                              {staticPopularSearches.map((item, idx) => (
                                <li
                                  key={`${item}-${idx}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handlePopularSearch(item);
                                  }}
                                  className="search-suggestion-item"
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <i className={`bx ${searchChipIcon(item)}`} />
                                    {item}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <button className="btn btn-primary btn-lg search-btn" type="submit">
                          <i className="bx bx-search pe-2" aria-hidden="true" />  Search
                        </button>
                      </div>
                    </form>
                    <div className="popular-searches mt-4">
                      <span>Popular Searches:</span>
                      <div className="popular-search-list mt-2">
                        {staticPopularSearches.map((search, idx) => (
                          <button
                            key={`${search}-${idx}`}
                            type="button"
                            className="btn btn-sm btn-search-chip"
                            onClick={() => handlePopularSearch(search)}
                          >
                            <i className={`bx ${searchChipIcon(search)}`} aria-hidden="true" />
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        <HomeCategoryShowcase />
        {/* <section className="popular-categories-section py-5">
          <div className="container-xl">
            <div className="section-title text-center mx-auto mb-4">
              <h2>Popular Product Categories</h2>
              <p>Explore top categories in electronics industry</p>
            </div>
            <div className="row g-3 justify-content-center">
              {(categoryLoading || popularCategories.length === 0
                ? [
                  { id: "components", name: "Components", countText: "25,000+ Products" },
                  { id: "equipment", name: "Manufacturing Equipment", countText: "8,500+ Products" },
                  { id: "pcb", name: "PCB & PCBA", countText: "7,200+ Products" },
                  { id: "raw-materials", name: "Raw Materials & Consumables", countText: "6,800+ Products" },
                  { id: "ems", name: "EMS & Services", countText: "3,500+ Products" },
                  { id: "industrial", name: "Industrial Electronics", countText: "4,200+ Products" },
                  { id: "telecom", name: "Telecom & Wireless", countText: "2,100+ Products" },
                  { id: "cables", name: "Cables & Connectors", countText: "3,900+ Products" },
                ]
                : popularCategories
              ).map((category, idx) => {
                const categoryName = category.name || category.title || "Category";
                const categorySlug = category.slug || "#";
                const categoryCount =
                  category.countText ||
                  category.product_count ||
                  category.count ||
                  category.product_count_text ||
                  "More than 1,000 Products";
                const imageUrl = category.file_name ? `${ROOT_URL}/${category.file_name}` : null;

                return (
                  <div className="col-6 col-md-4 col-lg-3 col-xl-2 d-flex" key={category.id || categoryName + idx}>
                    <Link
                      to={categorySlug.startsWith("#") ? "/categories" : `/categories/${categorySlug}`}
                      className="popular-category-card text-decoration-none h-100 d-flex flex-column"
                    >
                      <div className="category-card-icon">
                        {imageUrl ? (
                          <ImageWithFallback src={imageUrl} alt={categoryName} width={36} height={36} showFallback={true} />
                        ) : (
                          <ImageWithFallback src={`/icons/${(categorySlug || categoryName).toString().replace(/\s+/g, '-').toLowerCase()}.svg`} alt={categoryName} width={36} height={36} showFallback={true} />
                        )}
                      </div>
                      <div className="category-card-content mt-auto">
                        <h6>{categoryName}</h6>
                        <p>{categoryCount}</p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section> */}

        <section className="banner-stats-section py-4 d-none">
          <div className="container-xl">
            <div className="gridBox text-center justify-content-center rounded-4 shadow-sm bg-white px-5">
              {[
                { label: "Products", value: "50,000+", icon: "bx bx-package", iconClass: "product-icon" },
                { label: "Manufacturers", value: "3,000+", icon: "bx bx-buildings", iconClass: "manufacturer-icon" },
                { label: "Buyers", value: "10,000+", icon: "bx bx-user", iconClass: "buyers-icon" },
                { label: "Buy Leads", value: "5,000+", icon: "bx bx-message-alt-edit", iconClass: "leads-icon" },
                { label: "Verified", value: "100%", icon: "bx bx-shield-quarter", iconClass: "verified-icon" },
              ].map((stat, idx) => (
                <div key={idx} className="innerBox">
                  <div className="stat-card py-3 px-2 d-flex align-items-center justify-content-center gap-2">
                    <div className={`stat-icon ${stat.iconClass}`}>
                      <i className={stat.icon} />
                    </div>
                    <div className="stat-content text-start">
                      <p className="stat-value mb-1">{stat.value}</p>
                      <p className="stat-label mb-0">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Banner;