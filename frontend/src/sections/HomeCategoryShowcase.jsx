import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useSiteSettings } from "../context/SiteSettingsContext";

const DEFAULT_TRENDING_LIMIT = 12;

const itemSubCategoryProductPath = (isc) =>
  `/products?category_id=${isc.category_id}&subcategory_id=${isc.subcategory_id}&item_category_id=${isc.item_category_id}&item_subcategory_id=${isc.id}`;

const dedupeByName = (list) => {
  const seen = new Set();
  return (list || []).filter((item) => {
    const key = String(item.name || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const seededShuffle = (list, seedText) => {
  const arr = [...list];
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  const random = () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const HomeCategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCat, setOpenCat] = useState(null);
  const [openAll, setOpenAll] = useState(false);
  const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();

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
        } catch {
          // Sub categories fetch failed — continue with empty list
        }

        // 3. Assemble the nested sidebar hierarchy: category -> subcategory -> item subcategories
        const catById = new Map(catsWithProducts.map((cat) => [cat.id, cat]));
        const subById = new Map(subsWithProducts.map((sub) => [sub.id, sub]));

        const itemSubsBySub = new Map();

        const itemSubRes = await axios.get(`${API_BASE_URL}/item_sub_category`);
        if (cancelled) return;
        const allItemSubs = Array.isArray(itemSubRes.data) ? itemSubRes.data : [];
        const activeItemSubs = dedupeByName(
          allItemSubs.filter(
            (isc) =>
              Number(isc.product_count) > 0 &&
              Number(isc.status) === 1 &&
              Number(isc.is_delete || 0) === 0 &&
              !/deleted/i.test(String(isc.name || ""))
          )
        );

        activeItemSubs.forEach((isc) => {
          const subId = Number(isc.subcategory_id);
          const cat = catById.get(Number(isc.category_id));
          const sub = subById.get(subId);
          if (!cat || !sub || !isc.slug || !sub.slug || !cat.slug) return;
          if (!itemSubsBySub.has(subId)) itemSubsBySub.set(subId, []);
          itemSubsBySub.get(subId).push(isc);
        });

        itemSubsBySub.forEach((list) => {
          list.sort((a, b) => Number(b.product_count) - Number(a.product_count));
        });

        const nested = catsWithProducts.map((cat) => {
          const subs = subsWithProducts
            .filter((sub) => Number(sub.category) === Number(cat.id))
            .map((sub) => ({
              ...sub,
              item_subcategories: itemSubsBySub.get(Number(sub.id)) || [],
            }));
          return { ...cat, subcategories: subs };
        });

        if (cancelled) return;
        setCategories(nested);
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

  const trendingEnabled = String(siteSettings?.trending_b2b_enabled ?? '1') !== '0';
  const monthlyRandom = String(siteSettings?.trending_b2b_random_monthly ?? '1') !== '0';
  const trendingLimit = Math.max(1, Number(siteSettings?.trending_b2b_limit || DEFAULT_TRENDING_LIMIT) || DEFAULT_TRENDING_LIMIT);
  const trendingAllowedIds = String(siteSettings?.trending_b2b_item_subcategory_ids || '')
    .split(',')
    .map((id) => Number(String(id).trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  const computedTrending = (() => {
    const all = [];
    categories.forEach((cat) => {
      cat.subcategories?.forEach((sub) => {
        sub.item_subcategories?.forEach((isc) => {
          if (trendingAllowedIds.length > 0 && !trendingAllowedIds.includes(Number(isc.id))) return;
          if (!all.some((item) => item.id === isc.id)) {
            all.push({
              ...isc,
              category_id: cat.id,
              category_slug: cat.slug,
              subcategory_slug: sub.slug,
              item_category_id: isc.item_category_id || isc.id,
            });
          }
        });
      });
    });

    const filtered = all.filter((isc) => isc.file_name || isc.file_id || isc.product_count > 0);
    const sorted = monthlyRandom
      ? seededShuffle(filtered, new Date().toISOString().slice(0, 7))
      : [...filtered].sort((a, b) => Number(b.product_count) - Number(a.product_count) || Number(a.id) - Number(b.id));
    return sorted.slice(0, trendingLimit);
  })();

  const showTrending = trendingEnabled && computedTrending.length > 0;

  if (loading || siteSettingsLoading) {
    return (
      <section className="homeCategoryShowcase py-md-4 py-5">
        <div className="container-xxl">
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
  if (!hasCategories && !showTrending) return null;

  return (
    <section className="homeCategoryShowcase py-md-4 py-5 my-3">
      <div className="">
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
                                  {(sub.item_subcategories || []).slice(0, 5).map((isc) => (
                                    <li key={isc.id}>
                                      <Link to={itemSubCategoryProductPath(isc)}>{isc.name}</Link>
                                    </li>
                                  ))}
                                  {(sub.item_subcategories || []).length > 5 && (
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
          {showTrending && (
            <div className="trendingCategories">
              <div className="_title">
                <h2>Trending B2B Product Categories</h2>
              </div>
              <div className="tren_list">
                {computedTrending.map((ic) => (
                  <div className="tren_iteam" key={ic.id}>
                    <Link
                      to={`/products?category_id=${ic.category_id}&subcategory_id=${ic.subcategory_id}&item_category_id=${ic.item_category_id}&item_subcategory_id=${ic.id}`}
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
            <Link to="/registration" className="pbr-banner-link" aria-label="Promotional banner 1">
              <img src="/img1.png" alt="Promotional banner 1" loading="lazy" decoding="async" />
            </Link>
            <Link to="/enquiry" className="pbr-banner-link" aria-label="Promotional banner 2">
              <img src="/img2.png" alt="Promotional banner 2" loading="lazy" decoding="async" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HomeCategoryShowcase;
