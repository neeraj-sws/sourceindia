import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";

const SUBCAT_THEME = [
  { icon: "machine", bg: "#F1FAF7", fg: "#00A88A", light: "#E8F7F1" },
  { icon: "instrument", bg: "#FFF5ED", fg: "#FF8A3D", light: "#FFEAD8" },
  { icon: "laser", bg: "#EFF9FD", fg: "#20AEEA", light: "#DDf3FC" },
  { icon: "medical", bg: "#E6F6F7", fg: "#159AA8", light: "#D8F1F3" },
];

const TRUST_ITEMS = [
  { icon: "shield", title: "Quality Assured", subtitle: "100% quality checked products" },
  { icon: "badge", title: "Trusted Sellers", subtitle: "Verified & trusted suppliers" },
  { icon: "tag", title: "Best Prices", subtitle: "Competitive prices for bulk orders" },
  { icon: "headset", title: "Expert Support", subtitle: "Get expert guidance & support" },
];

/* -------------------------------------------------------------------------
   ProductSlider
------------------------------------------------------------------------- */
const ProductSlider = ({ children }) => {
  const scrollRef = useRef(null);
  const animRef = useRef(null);
  const lockRef = useRef(false);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const dragState = useRef({ active: false, moved: false, startX: 0, startScrollLeft: 0 });

  const cancelAnim = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setShowLeft(scrollLeft > 2);
    setShowRight(scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateArrows();

    const raf = requestAnimationFrame(updateArrows);

    el.addEventListener("scroll", updateArrows, { passive: true });
    el.addEventListener("load", updateArrows, true);
    window.addEventListener("resize", updateArrows);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateArrows);
      ro.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnim();
      el.removeEventListener("scroll", updateArrows);
      el.removeEventListener("load", updateArrows, true);
      window.removeEventListener("resize", updateArrows);
      ro?.disconnect();
    };
  }, [children]);

  const getSlideWidth = () => {
    const el = scrollRef.current;
    const first = el?.firstElementChild;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  };

  const animateTo = (to, duration = 400) => {
    const el = scrollRef.current;
    if (!el) return;
    cancelAnim();
    const from = el.scrollLeft;
    const clamped = Math.max(0, Math.min(to, el.scrollWidth - el.clientWidth));
    const delta = clamped - from;
    if (Math.abs(delta) < 0.5) {
      lockRef.current = false;
      updateArrows();
      return;
    }
    lockRef.current = true;
    el.style.scrollBehavior = "auto";
    const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const start = performance.now();
    const step = (now) => {
      if (dragState.current.active) {
        lockRef.current = false;
        animRef.current = null;
        el.style.scrollBehavior = "";
        return;
      }
      const t = Math.min((now - start) / duration, 1);
      el.scrollLeft = from + delta * easeInOut(t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        lockRef.current = false;
        el.scrollLeft = clamped;
        el.style.scrollBehavior = "";
        updateArrows();
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const scrollBySlide = (direction) => {
    if (lockRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const slide = getSlideWidth();
    if (!slide) return;
    const expected = el.scrollLeft + slide * direction;
    const target = Math.round(expected / slide) * slide;
    animateTo(target);
  };

  const beginDrag = (clientX) => {
    const el = scrollRef.current;
    if (!el) return;
    cancelAnim();
    lockRef.current = false;
    dragState.current = { active: true, moved: false, startX: clientX, startScrollLeft: el.scrollLeft };
    el.classList.add("is-dragging");
  };

  const continueDrag = (clientX) => {
    const el = scrollRef.current;
    const state = dragState.current;
    if (!state.active || !el) return;
    const dx = clientX - state.startX;
    if (Math.abs(dx) > 3) state.moved = true;
    el.scrollLeft = state.startScrollLeft - dx;
  };

  const endDrag = () => {
    const el = scrollRef.current;
    const state = dragState.current;
    if (!el || !state.active) return;
    dragState.current.active = false;
    el.classList.remove("is-dragging");
    if (!state.moved) return;
    const slide = getSlideWidth();
    if (!slide) return;
    const nearest = Math.max(0, Math.round(el.scrollLeft / slide));
    animateTo(nearest * slide);
  };

  // Mouse (desktop drag)
  const onMouseDown = (e) => {
    beginDrag(e.clientX);
  };
  const onMouseMove = (e) => {
    if (!dragState.current.active) return;
    e.preventDefault(); // avoid text/image selection while dragging
    continueDrag(e.clientX);
  };
  const onMouseUp = () => endDrag();
  const onMouseLeave = () => endDrag();

  // Touch (mobile) — native swipe already scrolls the container; we just
  // track movement so we can suppress an accidental card click afterwards.
  const onTouchStart = (e) => beginDrag(e.touches[0].clientX);
  const onTouchMove = (e) => continueDrag(e.touches[0].clientX);
  const onTouchEnd = () => endDrag();

  // Swallow the click that follows a drag so cards don't navigate unintentionally.
  const onClickCapture = (e) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="subcat-scroll-wrap">
      {showLeft && (
        <button
          type="button"
          className="subcat-scroll-arrow subcat-scroll-arrow--left"
          aria-label="Scroll left"
          onClick={() => scrollBySlide(-1)}
        >
          ‹
        </button>
      )}

      <div
        ref={scrollRef}
        className="subcat-scroll"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>

      {showRight && (
        <button
          type="button"
          className="subcat-scroll-arrow subcat-scroll-arrow--right"
          aria-label="Scroll right"
          onClick={() => scrollBySlide(1)}
        >
          ›
        </button>
      )}
    </div>
  );
};

const SubCategory = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [itemCatProducts, setItemCatProducts] = useState({});
  const [fetchedKeys, setFetchedKeys] = useState(() => new Set());

  // Every subcategory of this category (shown in full, not filtered).
  const allSubcategories = useMemo(() => category?.subcategories || [], [category]);

  // For each subcategory, its top 3 item categories (by product count).
  const subcategoryItems = useMemo(
    () =>
      allSubcategories.map((sub) => ({
        sub,
        itemCategories: (sub.item_categories || [])
          .filter((ic) => ic.product_count > 0)
          .sort((a, b) => b.product_count - a.product_count)
          .slice(0, 3),
      })),
    [allSubcategories]
  );

  // Keys of every (sub, item-category) product fetch we expect to complete.
  const expectedFetchKeys = useMemo(
    () =>
      subcategoryItems.flatMap(({ sub, itemCategories }) =>
        itemCategories.map((ic) => `${sub.id}_${ic.id}`)
      ),
    [subcategoryItems]
  );
  const allFetched =
    expectedFetchKeys.length > 0 && expectedFetchKeys.every((k) => fetchedKeys.has(k));

  // Subcategories that still have real products once fetches complete.
  // While any fetch is still in flight we keep everything visible (skeleton stage).
  const visibleSubcategories = useMemo(() => {
    if (!allFetched) return subcategoryItems;
    return subcategoryItems.filter(({ sub, itemCategories }) =>
      itemCategories.some(
        (ic) => (itemCatProducts[`${sub.id}_${ic.id}`] || []).length > 0
      )
    );
  }, [subcategoryItems, itemCatProducts, allFetched]);

  // =========================================================
  // 🟢 FETCH PRODUCTS FOR EACH ITEM CATEGORY
  // =========================================================
  useEffect(() => {
    const groups = subcategoryItems;
    if (!groups.length || !category?.id) return;

    let cancelled = false;

    groups.forEach(({ sub, itemCategories }) => {
      itemCategories.forEach(async (ic) => {
        try {
          const res = await axios.get(`${API_BASE_URL}/products`, {
            params: {
              category: category.id,
              sub_category: sub.id,
              item_category_id: ic.id,
              is_delete: 0,
              status: 1,
              is_approve: 1,
              is_front: 1,
              limit: 10,
              sort_by: "newest",
            },
          });

          if (!cancelled) {
            // Keep only products that genuinely belong to this
            // Category → SubCategory → Item Category (matched by ID).
            const products = (res.data.products || []).filter(
              (p) =>
                String(p.category) === String(category.id) &&
                String(p.sub_category) === String(sub.id) &&
                String(p.item_category_id) === String(ic.id)
            );

            console.log(
              `[SubCategory] category=${category.id} sub=${sub.id} itemCat=${ic.id} → ${products.length}/${(res.data.products || []).length} products`,
              { sample: products[0] || null }
            );

            setItemCatProducts((prev) => ({
              ...prev,
              [`${sub.id}_${ic.id}`]: products,
            }));

            setFetchedKeys((prev) => {
              const next = new Set(prev);
              next.add(`${sub.id}_${ic.id}`);
              return next;
            });
          }
        } catch (err) {
          console.error(`Error fetching products for subcategory ${sub.id} item category ${ic.id}:`, err);
          setFetchedKeys((prev) => {
            const next = new Set(prev);
            next.add(`${sub.id}_${ic.id}`);
            return next;
          });
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [category, subcategoryItems]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/sub-category-item?slug=${slug}&page=1&limit=200`
        );

        const data = res.data;

        setTimeout(() => {
          if (data && data.category) {
            setCategory(data.category);
          }

          setShowSkeleton(false);
        }, 1000); // ⏱️ 1 second skeleton
      } catch (err) {
        console.error("Error fetching categories:", err);
        setShowSkeleton(false);
      }
    };

    fetchCategories();
  }, [slug]);

  /* ----------------------------- Skeleton UI ----------------------------- */
  const Skeleton = ({ width = "100%", height = "16px", style = {} }) => (
    <div
      style={{
        width,
        height,
        background: "#edf7fc",
        backgroundSize: "400% 100%",
        animation: "skeleton-loading 1.4s ease infinite",
        borderRadius: "6px",
        ...style,
      }}
    />
  );

  const SubCategorySkeleton = () => (
    <>
      <style>{`@keyframes skeleton-loading{0%{background-position:100% 50%}100%{background-position:0 50%}}`}</style>
      <section className="categorySection py-md-4 pt-2 my-4">
        <div className="container-xxl">
          <Skeleton height="120px" style={{ marginBottom: 24, borderRadius: 16 }} />
          <div className="row g-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="col-6 col-lg-3">
                <Skeleton height="76px" style={{ borderRadius: 12 }} />
              </div>
            ))}
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="row g-3 mb-4">
              <div className="col-3">
                <Skeleton height="18px" width="80%" style={{ marginBottom: 12 }} />
                <Skeleton height="14px" width="90%" style={{ marginBottom: 6 }} />
                <Skeleton height="14px" width="60%" />
              </div>
              <div className="col-9 d-flex gap-3">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} width="150px" height="150px" style={{ borderRadius: 10, flexShrink: 0 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  if (showSkeleton) return <SubCategorySkeleton />;
  if (!category) return null;

  return (
    <section className="categorySection py-md-4 pt-2 my-4">
      <style>{styles}</style>

      <div className="container-xxl">
        {/* ============================= BREADCRUMB ============================= */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <a href="/" className="text-decoration-none">Home</a>
            </li>
            <li className="breadcrumb-item">
              <a href="/categories" className="text-decoration-none">Categories</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        {/* ============================= CATEGORY TITLE (simple text) ============================= */}
        <div className="category-header">
          <h1 className="category-header-title">{category.name}</h1>
          {category.description && (
            <p className="category-header-desc">{category.description}</p>
          )}
        </div>

        {/* =============== SUBCATEGORY SECTIONS (each → 3 item categories) =============== */}
        {visibleSubcategories.length > 0 ? (
          visibleSubcategories.map(({ sub, itemCategories }, si) => {
            const theme = SUBCAT_THEME[si % SUBCAT_THEME.length];
            const availableItemCategories = allFetched
              ? itemCategories.filter(
                (ic) => (itemCatProducts[`${sub.id}_${ic.id}`] || []).length > 0
              )
              : itemCategories;
            return (
              <div className="subcat-group" key={sub.id}>
                <div className="cat-banner subcat-banner">
                  <div className="cat-banner-icon" style={{ background: theme.bg, color: theme.fg }}>
                    <img
                      src={sub.file_name ? `${ROOT_URL}/${sub.file_name}` : "/default.png"}
                      alt=""
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default.png";
                      }}
                    />
                  </div>
                  <div className="cat-banner-copy">
                    <h2 className="cat-banner-title">{sub.name}</h2>
                    {sub.description && <p className="cat-banner-desc">{sub.description}</p>}
                  </div>
                  <a
                    href={`/categories/${category.slug}/${sub.slug}`}
                    className="cat-banner-arrow"
                    // style={{ color: theme.fg, borderColor: theme.fg, background: theme.light }}
                    aria-label={`View all products in ${sub.name}`}
                  >
                    →
                  </a>

                </div>

                {availableItemCategories.length > 0 ? (
                  availableItemCategories.map((ic) => (
                    <div className="subcat-row" key={ic.id}>
                      <div className="subcat-info">
                        <div className="subcat-info-top">
                          {ic.file_name && (
                            <span className="subcat-info-icon">
                              <img
                                src={`${ROOT_URL}/${ic.file_name}`}
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.parentElement.style.display = "none";
                                }}
                              />
                            </span>
                          )}
                          <h5 className="subcat-info-title">{ic.name}</h5>
                        </div>
                        <a
                          href={`/products?item_category_id=${ic.id}`}
                          className="subcat-info-link"
                        // style={{ color: theme.fg, borderColor: theme.fg, background: theme.light }}
                        >
                          View all Products <span>→</span>
                        </a>
                      </div>

                      <ProductSlider>
                        {(itemCatProducts[`${sub.id}_${ic.id}`] || []).length > 0 ? (
                          (itemCatProducts[`${sub.id}_${ic.id}`] || []).map((p) => (
                            <a
                              key={p.id}
                              href={`/products/${p.slug || p.id}`}
                              className="product-card"
                            >
                              <div className="product-card-img">
                                <img
                                  src={p.file_name ? `${ROOT_URL}/${p.file_name}` : "/default.png"}
                                  alt={p.title}
                                  loading="lazy"
                                  decoding="async"
                                  draggable={false}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/default.png";
                                  }}
                                />
                              </div>
                              <div>
                                <div className="product-card-name">{p.title}</div>
                                {p.company_name && (
                                  <div className="product-card-company"><b class="soldtext">Sold by :</b> {p.company_name}</div>
                                )}
                              </div>
                              {/* <div className="product-card-price">
                                {p.price ? (
                                  <>₹{p.price}</>
                                ) : (
                                  <span className="product-card-cta">Get Latest Price</span>
                                )}
                              </div> */}
                              {/* <div className="product-card-view">
                                <span>View Details</span>
                                <span className="product-card-eye">{ICONS.eye}</span>
                              </div> */}
                            </a>
                          ))
                        ) : (
                          [...Array(4)].map((_, j) => (
                            <div key={j} className="product-card product-card--placeholder">
                              <Skeleton height="104px" style={{ borderRadius: 5, marginBottom: 8 }} />
                              <Skeleton height="12px" width="85%" style={{ marginBottom: 6 }} />
                              <Skeleton height="11px" width="55%" style={{ marginBottom: 6 }} />
                              <Skeleton height="11px" width="70%" />
                            </div>
                          ))
                        )}
                      </ProductSlider>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">No item categories found.</p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-muted small">No sub categories found.</p>
        )}

        {/* ============================= TRUST BAR ============================= */}
        {/* <div className="trust-bar">
          {TRUST_ITEMS.map((item) => (
            <div className="trust-item" key={item.title}>
              <span className="trust-item-icon">{ICONS[item.icon]}</span>
              <div>
                <div className="trust-item-title">{item.title}</div>
                <div className="trust-item-subtitle">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------
   Styles — scoped to this page via the `categorySection` wrapper.
   Kept as a single template string (matching the existing inline-<style>
   pattern already used for the skeleton) so the component stays a single
   drop-in file; move into a .css/.module.css file if your build prefers it.
------------------------------------------------------------------------- */
const styles = `
@keyframes skeleton-loading { 0% { background-position:100% 50%; } 100% { background-position:0 50%; } }

.categorySection {
  color:#202525;
  font-family:'Inter',Roboto,-apple-system,'Segoe UI',system-ui,Arial,sans-serif;
}

/* Hero banner */
.cat-banner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    background: #edf7fc;
    border: 1px solid #eef2f2;
    border-radius: 12px;
    padding: 8px 8px 8px;
    overflow: hidden;
    margin-bottom: 16px;
}
.cat-banner-icon {
    flex: 0 0 auto;
    width: 45px;
    height: 35px;
    border-radius: 12px;
    background: #0f6d3f;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.cat-banner-icon img{ width:100%;height:100%;object-fit:contain; }
.cat-banner-copy{ position:relative; z-index:1; max-width:60%; }
.cat-banner-title{ font-size:1.3rem; font-weight:700; margin:0 0 6px; color:#252b2b; }
.cat-banner-desc{ font-size:.82rem; color:#6f7777; margin:0; line-height:1.4; display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden; }
.cat-banner-media{
  margin-left:auto;
  width:280px; height:72px;
  border-radius:12px;
  overflow:hidden;
  flex:0 0 auto;
}
.cat-banner-media img{ width:100%; height:100%; object-fit:cover; }
.cat-banner-media-fallback{
  width:100%; height:100%;
  background:repeating-linear-gradient(135deg,#dfeee5 0 10px,#eaf5ee 10px 20px);
  opacity:.7;
}
@media (max-width:768px){
  .cat-banner{ flex-wrap:wrap; }
  .cat-banner-copy{ max-width:100%; padding-right:40px; }
  .cat-banner-media{ display:none; }
}

/* Category simple text header */
.category-header{ margin-bottom:18px; }
.category-header-title{ font-size:1.4rem; font-weight:700; color:#252b2b; margin:0 0 4px; }
.category-header-desc{ font-size:.82rem; color:#6f7777; margin:0; line-height:1.5; }

/* Quick-nav tabs */
.cat-tabs{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
  margin-bottom:26px;
}
@media (max-width:900px){ .cat-tabs{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .cat-tabs{ grid-template-columns:1fr; } }

.cat-tab{
  display:flex;
  align-items:center;
  gap:12px;
  text-align:left;
  background:#fff;
  border:1px solid #e6e8ec;
  border-radius:12px;
  padding:14px 16px;
  cursor:pointer;
  transition:border-color .15s ease, box-shadow .15s ease;
}
.cat-tab:hover{ border-color:#c9dfd0; }
.cat-tab--active{
  border-color:#1c9a5b;
  box-shadow:0 0 0 1px #1c9a5b inset;
}
.cat-tab-icon{
  flex:0 0 auto;
  width:38px;height:38px;
  border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.cat-tab-icon img{ width:100%;height:100%;object-fit:contain; }
.cat-tab-text{ display:flex; flex-direction:column; gap:2px; min-width:0; }
.cat-tab-name{ font-size:.88rem; font-weight:600; color:#1f2430; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cat-tab-count{ font-size:.76rem; color:#8a929c; }

/* Subcategory group (banner header + its item-category rows) */
.subcat-group {
    margin-bottom: 40px;
    background: white;
    padding: 1px 15px;
    box-shadow:0 0 4px rgb(170 161 161 / 99%);
    border-radius: 8px;
}
.subcat-group > .subcat-row:last-of-type{ border-bottom:none; }
.subcat-banner{ margin:16px 0 8px; }
.cat-banner-arrow{
  position:absolute;
  top:10px;
  right:20px;
  width:30px;height:30px;
  border-radius:50%;
  border:1px solid;
  display:flex;align-items:center;justify-content:center;
  font-size:.72rem;
  font-weight:600;
  line-height:1;
  text-decoration:none;
  box-shadow:0 3px 6px rgba(0,0,0,.15);
  z-index:2;
}

/* Subcategory row */
.subcat-row {
    display: flex;
    gap: 14px;
    padding: 7px 0;
    border-bottom: 1px solid #f0f3f3;
    scroll-margin-top: 16px;
    width: 100%;
    margin: 0 auto;
}
.subcat-row:last-of-type{ border-bottom:none; }
@media (max-width:745px){
  .subcat-row{
    display:block;
  }
  .subcat-info{
    flex:none;
    width:100%;
    margin-bottom:12px;
  }
}

.subcat-info {
    flex: 0 0 200px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    gap: 8px;
    padding: 14px;
    background: #edf7fc;
    border: 1px solid #dee4e4;
    border-radius: 8px;
    
}
.subcat-info-top{ display:flex; align-items:center; gap:10px; min-width:0; }
.subcat-info-icon{
  flex:0 0 auto;
  width:40px;height:40px;
  border-radius:9px;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.subcat-info-icon img{ width:24px;height:24px;object-fit:contain; }
.subcat-info-title{ font-size:14px; font-weight:700; margin:0; color:#202525; line-height:1.25; }
.subcat-info-desc{ font-size:.72rem; color:#6f7777; margin:0; line-height:1.45; }
.subcat-info-link {
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    padding: 4px 10px;
    border: 1px solid;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #fff;
    transition: background .15s ease;
    align-self: flex-start;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    color: rgb(22, 131, 216);
}

.subcat-scroll-wrap{ position:relative; flex:1 1 auto; min-width:0; }
.subcat-scroll {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding-bottom: 4px;
    cursor: grab;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.subcat-scroll::-webkit-scrollbar{ display:none; height:0; } /* Chrome / Safari / new Edge */
.subcat-scroll.is-dragging{
  cursor:grabbing;
  scroll-behavior:auto; /* avoid fighting the drag with smooth-scroll easing */
  user-select:none;
}
.subcat-scroll.is-dragging *{ user-select:none; }
.subcat-scroll img{ -webkit-user-drag:none; user-drag:none; }

.subcat-scroll-arrow{
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  width:30px;height:30px;
  border-radius:50%;
  border:1px solid #e8eeee;
  background:#fff;
  font-size:1rem;
  line-height:1;
  color:#6f7777;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 4px rgba(0,0,0,.05);
  z-index:1;
}
  .soldtext {
    color: #335577;
}
.subcat-scroll-arrow--left{ left:-6px; }
.subcat-scroll-arrow--right{ right:-6px; }

.subcat-scroll > *{
  flex:0 0 calc((100% - 48px)/3); /* exactly 5 cards fill the available area (4 gaps x 12px) */
  min-width:150px;
  box-sizing:border-box;
}
.product-card{
  display:flex;
  // flex-direction:column;
  border:1px solid #eef2f2;
  border-radius:7px;
  padding:10px;
  text-decoration:none;
  color:inherit;
  background:#fff;
  transition:box-shadow .15s ease, transform .15s ease;
  align-items: center;
    gap: 6px;
}
.product-card:hover{ box-shadow:0 4px 14px rgba(0,0,0,.06);  }
.product-card--placeholder{ pointer-events:none; }
.product-card-img{
  flex:0 0 auto;
  width:90px; height:75px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:8px;
  background:#f7fafa;
  border-radius:5px;
}
.product-card-img img{ width:100%; height:100%; object-fit:contain; padding:4px; box-sizing:border-box; }
.product-card-name{
  font-size:15px; font-weight:600; color:#202525;
  line-height:1.4; margin-bottom:5px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  white-space: wrap; text-overflow: ellipsis;
}
.product-card-company{
  font-size:.8rem; color:rgb(22, 131, 216); margin-bottom:5px;
  display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;font-weight:500;
}
.product-card-price{ font-size:.78rem; font-weight:700; color:#00a88a; margin-bottom:5px; }
.product-card-cta{ color:#00a88a; }
// .product-card-view{
//   margin-top:auto; /* pins all "View Details" to the same bottom line */
//   display:flex; align-items:center; justify-content:space-between;
//   border-top:1px solid #f1f4f4;
//   padding-top:7px;
//   font-size:.68rem; color:#6f7777;
// }
.product-card-eye{ display:inline-flex; align-items:center; color:#8a929c; font-size:.78rem; }

/* Trust bar */
.trust-bar{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
  background:#f3faf8;
  border:1px solid #eaf4f1;
  border-radius:8px;
  padding:12px 20px;
  margin-top:24px;
}
@media (max-width:900px){ .trust-bar{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .trust-bar{ grid-template-columns:1fr; } }
.trust-item{ display:flex; align-items:center; gap:10px; }
.trust-item-icon{ color:#00a88a; flex:0 0 auto; }
.trust-item-title{ font-size:.8rem; font-weight:700; color:#202525; }
.trust-item-subtitle{ font-size:.7rem; color:#6f7777; }
`;

export default SubCategory;
