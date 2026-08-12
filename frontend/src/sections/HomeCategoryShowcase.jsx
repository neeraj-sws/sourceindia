import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";

const TRENDING_LIMIT = 12;

const itemCategoryPath = (cat, sub, ic) =>
  `/categories/${cat.slug}/${sub.slug}/${ic.slug}`;

const dedupeByName = (list) => {
  const seen = new Set();
  return (list || []).filter((item) => {
    const key = String(item.name || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildTrendingTiles = (items, catById, subById) => {
  const withSlugs = items
    .map((ic) => {
      const cat = catById.get(Number(ic.category_id));
      const sub = subById.get(Number(ic.subcategory_id));
      if (!cat || !sub || !ic.slug || !cat.slug || !sub.slug) return null;
      return {
        id: ic.id,
        name: ic.name,
        slug: ic.slug,
        category_slug: cat.slug,
        subcategory_slug: sub.slug,
        file_name: ic.file_name || null,
        product_count: Number(ic.product_count) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.product_count - a.product_count || a.id - b.id);

  // Prefer tiles that carry an image; top-up the remainder so we still
  // render up to 12 real hierarchy items (never duplicated images).
  const withImage = withSlugs.filter((t) => t.file_name);
  const withoutImage = withSlugs.filter((t) => !t.file_name);
  return [...withImage, ...withoutImage].slice(0, TRENDING_LIMIT);
};

const HomeCategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCat, setOpenCat] = useState(null);
  const [openAll, setOpenAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // 1. Top-level categories (same flow as Product Listing page)
        const catRes = await axios.get(`${API_BASE_URL}/categories?is_delete=0`);
        if (cancelled) return;
        const allCats = Array.isArray(catRes.data) ? catRes.data : [];
        const catsWithProducts = dedupeByName(
          allCats.filter((cat) => Number(cat.product_count) > 0)
        );
        if (catsWithProducts.length === 0) return;

        const categoryIds = catsWithProducts.map((cat) => cat.id);

        // 2. Sub categories by selected categories (Product Listing page API)
        let subsWithProducts = [];
        try {
          const subRes = await axios.post(
            `${API_BASE_URL}/sub_categories/categories`,
            { categories: categoryIds }
          );
          if (cancelled) return;
          const allSubs = Array.isArray(subRes.data) ? subRes.data : [];
          subsWithProducts = dedupeByName(
            allSubs.filter((sub) => Number(sub.product_count) > 0)
          );
        } catch (err) {
          console.error("Error fetching sub categories by categories:", err);
        }

        // 3. Item categories by selected category/subcategory (Product Listing page API)
        let items = [];
        if (subsWithProducts.length > 0) {
          const subcategoryIds = subsWithProducts.map((sub) => sub.id);
          try {
            const icRes = await axios.post(
              `${API_BASE_URL}/item_category/by-selected-category-subcategory`,
              { categories: categoryIds, subcategories: subcategoryIds }
            );
            if (cancelled) return;
            const allItems = Array.isArray(icRes.data) ? icRes.data : [];
            items = dedupeByName(
              allItems.filter(
                (ic) =>
                  Number(ic.product_count) > 0 &&
                  !/deleted/i.test(String(ic.name || ''))
              )
            );
          } catch (err) {
            console.error("Error fetching item categories:", err);
          }
        }

        // Assemble the nested sidebar hierarchy: category -> subcategory -> item categories
        const catById = new Map(catsWithProducts.map((cat) => [cat.id, cat]));
        const subById = new Map(subsWithProducts.map((sub) => [sub.id, sub]));

        const itemsBySub = new Map();
        items.forEach((ic) => {
          const subId = Number(ic.subcategory_id);
          const cat = catById.get(Number(ic.category_id));
          const sub = subById.get(subId);
          if (!cat || !sub || !ic.slug || !sub.slug || !cat.slug) return;
          if (!itemsBySub.has(subId)) itemsBySub.set(subId, []);
          itemsBySub.get(subId).push(ic);
        });

        const nested = catsWithProducts.map((cat) => {
          const subs = subsWithProducts
            .filter((sub) => Number(sub.category) === Number(cat.id))
            .map((sub) => ({
              ...sub,
              item_categories: itemsBySub.get(Number(sub.id)) || [],
            }));
          return { ...cat, subcategories: subs };
        });

        const tiles = buildTrendingTiles(items, catById, subById);

        if (cancelled) return;
        setCategories(nested);
        setTrending(tiles);
      } catch (err) {
        console.error("Error fetching home category showcase:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const SidebarSkeleton = () => (
    <div className="sidebar">
      <span
        className="content-placeholder"
        style={{ display: "block", width: "100%", height: 42, borderRadius: 0 }}
      ></span>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="d-flex align-items-center justify-content-between gap-2"
          style={{ padding: "13px 16px", borderBottom: "1px solid #f0f0f0" }}
        >
          <span className="content-placeholder" style={{ width: "55%", height: 14 }}></span>
          <span className="content-placeholder" style={{ width: 14, height: 14 }}></span>
        </div>
      ))}
    </div>
  );

  const TrendingSkeleton = () => (
    <div className="tren_list">
      {Array.from({ length: 12 }).map((_, i) => (
        <div className="tren_iteam" key={i}>
          <div className="tren_img">
            <span className="content-placeholder" style={{ display: "block", width: "100%", height: "100%" }}></span>
          </div>
          <div className="tren_title">
            <span className="content-placeholder" style={{ display: "block", width: "70%", height: 13, margin: "0 auto" }}></span>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="homeCategoryShowcase py-md-4 py-3">
        <div className="container-xl browseCategoriesContainer">
          <div className="browseCategories">
            <SidebarSkeleton />
            <div className="trendingCategories">
              <div className="_title"><h2>Trending B2B Product Categories</h2></div>
              <TrendingSkeleton />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasCategories = categories.length > 0;
  const hasTrending = trending.length > 0;
  if (!hasCategories && !hasTrending) return null;

  return (
    <section className="homeCategoryShowcase py-md-4 py-3">
      <div className="container-xl browseCategoriesContainer">
        <div className="browseCategories">
          {/* ===== LEFT - TOP CATEGORIES (hover mega menu) ===== */}
          {hasCategories && (
            <div className="sidebar">
              <div className="bcs-header">
                <i className="bx bx-menu-alt-left bcs-header-icon"></i>
                Top Categories
              </div>
              <ul className="mc-list">
                {categories.slice(0, 10).map((cat, index) => {
                  const isOpen = openCat === index;
                  return (
                  <li
                    className={`mcl-iteam${isOpen ? " open" : ""}`}
                    key={cat.id}
                  >
                    <Link to={`/categories/${cat.slug}`} className="mcl-iteam-link">
                      {cat.file_name && (
                        <img
                          className="svg_icon"
                          src={`${ROOT_URL}/${cat.file_name}`}
                          alt=""
                          width={24}
                          height={24}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <span className="mcl-iteam-name">{cat.name}</span>
                      <i className="bx bx-chevron-right mcl-iteam-arrow"></i>
                    </Link>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <>
                      <button
                        type="button"
                        className="mcl-iteam-toggle"
                        aria-expanded={isOpen}
                        aria-label={`Toggle ${cat.name} subcategories`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenCat(isOpen ? null : index);
                        }}
                      >
                        <i className={`bx ${isOpen ? "bx-chevron-up" : "bx-chevron-down"}`}></i>
                      </button>
                      <ul className="mcsc">
                        {cat.subcategories.map((sub) => (
                          <li className="mcsc-iteam" key={sub.id}>
                            <p className="mcsc-heading">
                              <Link to={`/categories/${cat.slug}/${sub.slug}`}>{sub.name}</Link>
                            </p>
                            <ul className="mcsc-list">
                              {(sub.item_categories || []).slice(0, 5).map((ic) => (
                                <li key={ic.id}>
                                  <Link to={itemCategoryPath(cat, sub, ic)}>{ic.name}</Link>
                                </li>
                              ))}
                              {(sub.item_categories || []).length > 5 && (
                                <li className="mcsc-view-all">
                                  <Link to={`/categories/${cat.slug}/${sub.slug}`}>View More</Link>
                                </li>
                              )}
                            </ul>
                          </li>
                        ))}
                      </ul>
                      </>
                    )}
                  </li>
                  );
                })}
              </ul>
              <div className={`all-cl${openAll ? " open" : ""}`}>
                <div className="all-cl-row">
                  <Link to="/categories" className="all-cl-iteam">
                    <i className="bx bx-grid-alt all-cl-img"></i>
                    All Categories
                  </Link>
                  <button
                    type="button"
                    className="all-cl-toggle"
                    aria-expanded={openAll}
                    aria-label="Toggle all categories list"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenAll(!openAll);
                    }}
                  >
                    <i className={`bx ${openAll ? "bx-chevron-up" : "bx-chevron-down"}`}></i>
                  </button>
                </div>
                <ul className="all-cl-list">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link to={`/categories/${cat.slug}`}>{cat.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ===== CENTER - TRENDING B2B PRODUCT CATEGORIES ===== */}
          {hasTrending && (
            <div className="trendingCategories">
              <div className="_title">
                <h2>Trending B2B Product Categories</h2>
              </div>
              <div className="tren_list">
                {trending.map((ic) => (
                  <div className="tren_iteam" key={ic.id}>
                    <Link
                      to={`/categories/${ic.category_slug}/${ic.subcategory_slug}/${ic.slug}`}
                      title={ic.name}
                    >
                      <div className="tren_img">
                        {/* {ic.file_name ? (
                          <img
                            src={`${ROOT_URL}/${ic.file_name}`}
                            alt={ic.name}
                            loading="lazy"
                            decoding="async"
                            width={200}
                            height={200}
                          />
                        ) : (
                          <i
                            className="bx bx-category"
                            style={{ fontSize: 32, color: "#c6c6c6" }}
                          ></i>
                        )} */}
                        <img
  src={ic.file_name ? `${ROOT_URL}/${ic.file_name}` : "/default.png"}
  alt={ic.name}
  loading="lazy"
  decoding="async"
  width={200}
  height={200}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/default.png";
  }}
/>
                      </div>
                      <div className="tren_title">{ic.name}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== RIGHT - promotional banners ===== */}
          <div className="promotional-banners">
            <Link to="/categories" className="pbr-banner-link" aria-label="Promotional banner 1">
              <img src="/img1.png" alt="Promotional banner 1" loading="lazy" decoding="async" />
            </Link>
            <Link to="/categories" className="pbr-banner-link" aria-label="Promotional banner 2">
              <img src="/img2.png" alt="Promotional banner 2" loading="lazy" decoding="async" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeCategoryShowcase;
