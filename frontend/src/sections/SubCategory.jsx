import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";

/* -------------------------------------------------------------------------
   Small inline icon set (kept dependency-free — swap for your icon library
   if you already have one, e.g. lucide-react / react-icons)
------------------------------------------------------------------------- */
const ICONS = {
  machine: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M4 7h9l3 3h4v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="8.5" cy="15" r="1.4" fill="currentColor" />
      <circle cx="14.5" cy="15" r="1.4" fill="currentColor" />
    </svg>
  ),
  instrument: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="4" y="4" width="16" height="12" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 20h10M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  laser: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.6 2.2" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 12h4l2-5 3 10 2-7 1.5 2H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 13.5 7 21l5-2.4 5 2.4-1.5-7.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M12 3h6a2 2 0 0 1 2 2v6l-9.5 9.5a2 2 0 0 1-2.8 0L4 17.8a2 2 0 0 1 0-2.8L13.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16.2" cy="7.8" r="1.2" fill="currentColor" />
    </svg>
  ),
  headset: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="3" y="13" width="4" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17" y="13" width="4" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 19v1a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

// Cycle a palette + icon across subcategories so every row reads distinctly,
// the way "Optical Machine / Instruments / Laser Machine / Medical Laser" do.
const SUBCAT_THEME = [
  { icon: "machine", bg: "#e7f6ee", fg: "#1c9a5b" },
  { icon: "instrument", bg: "#fdece0", fg: "#e07a2c" },
  { icon: "laser", bg: "#e6f0ff", fg: "#2f6fed" },
  { icon: "medical", bg: "#e6f6f7", fg: "#159aa8" },
];

const TRUST_ITEMS = [
  { icon: "shield", title: "Quality Assured", subtitle: "100% quality checked products" },
  { icon: "badge", title: "Trusted Sellers", subtitle: "Verified & trusted suppliers" },
  { icon: "tag", title: "Best Prices", subtitle: "Competitive prices for bulk orders" },
  { icon: "headset", title: "Expert Support", subtitle: "Get expert guidance & support" },
];

/* -------------------------------------------------------------------------
   ProductSlider
   Drag-to-scroll / swipeable wrapper around the existing product row.
   - Mouse + touch dragging (desktop drag, mobile native swipe still works
     because we only take over on touchmove for horizontal intent).
   - Arrows are shown/hidden based on actual scrollLeft / scrollWidth,
     not a fixed product count.
   - No visible scrollbar (see `.subcat-scroll` CSS — scrolling stays enabled).
   Card markup/design passed in as `children` is left completely untouched.
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

    const raf = requestAnimationFrame(updateArrows); // re-check once layout/images settle

    el.addEventListener("scroll", updateArrows, { passive: true });
    el.addEventListener("load", updateArrows, true); // capture phase: catches <img> load events
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

  // Width of one slide = a single card + the flex gap between cards.
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
          }
        } catch (err) {
          console.error(`Error fetching products for subcategory ${sub.id} item category ${ic.id}:`, err);
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
        background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 37%,#e0e0e0 63%)",
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
        {subcategoryItems.length > 0 ? (
          subcategoryItems.map(({ sub, itemCategories }, si) => {
            const theme = SUBCAT_THEME[si % SUBCAT_THEME.length];
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
                    <a
                      href={`/categories/${category.slug}/${sub.slug}`}
                      className="subcat-info-link subcat-banner-link"
                      style={{ color: theme.fg, borderColor: theme.fg }}
                    >
                      View all {sub.name} Products <span>→</span>
                    </a>
                  </div>
                  <div className="cat-banner-media" aria-hidden="true">
                    {sub.file_name ? (
                      <img
                        src={`${ROOT_URL}/${sub.file_name}`}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="cat-banner-media-fallback" />
                    )}
                  </div>
                </div>

                {itemCategories.length > 0 ? (
                  itemCategories.map((ic) => (
                    <div className="subcat-row" key={ic.id}>
                      <div className="subcat-info">
                        <span className="subcat-info-icon" style={{ background: theme.bg, color: theme.fg }}>
                          <img
                            src={ic.file_name ? `${ROOT_URL}/${ic.file_name}` : "/default.png"}
                            alt=""
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default.png";
                            }}
                          />
                        </span>
                        <h5 className="subcat-info-title">{ic.name}</h5>
                        {ic.description && <p className="subcat-info-desc">{ic.description}</p>}
                        <a
                          href={`/categories/${category.slug}/${sub.slug}/${ic.slug}`}
                          className="subcat-info-link"
                          style={{ color: theme.fg, borderColor: theme.fg }}
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
                              <div className="product-card-name">{p.title}</div>
                              <div className="product-card-company"><b>Sold by: </b>{p.company_name}</div>
                              {/* <div className="product-card-price">
                                {p.price ? (
                                  <>₹{p.price}</>
                                ) : (
                                  <span className="product-card-cta">Get Latest Price</span>
                                )}
                              </div>
                              <span className="product-card-view">
                                {ICONS.eye} View Details
                              </span> */}
                            </a>
                          ))
                        ) : (
                          [...Array(4)].map((_, j) => (
                            <div key={j} className="product-card product-card--placeholder">
                              <Skeleton height="90px" style={{ borderRadius: 8, marginBottom: 10 }} />
                              <Skeleton height="12px" width="80%" style={{ marginBottom: 6 }} />
                              <Skeleton height="12px" width="55%" />
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
        <div className="trust-bar">
          {TRUST_ITEMS.map((item) => (
            <div className="trust-item" key={item.title}>
              <span className="trust-item-icon">{ICONS[item.icon]}</span>
              <div>
                <div className="trust-item-title">{item.title}</div>
                <div className="trust-item-subtitle">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
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

.categorySection { color:#1f2430; }

/* Hero banner */
.cat-banner{
  position:relative;
  display:flex;
  align-items:center;
  gap:20px;
  background:linear-gradient(120deg,#eef8f2 0%,#f7fbf8 55%,#ffffff 100%);
  border:1px solid #e3efe8;
  border-radius:16px;
  padding:22px 24px;
  overflow:hidden;
  margin-bottom:20px;
}
.cat-banner-icon{
  flex:0 0 auto;
  width:52px;height:52px;
  border-radius:12px;
  background:#0f6d3f;
  color:#fff;
  display:flex;align-items:center;justify-content:center;
  overflow:hidden;
}
.cat-banner-icon img{ width:100%;height:100%;object-fit:contain; }
.cat-banner-copy{ position:relative; z-index:1; max-width:60%; }
.cat-banner-title{ font-size:1.5rem; font-weight:700; margin:0 0 6px; color:#12261c; }
.cat-banner-desc{ font-size:.9rem; color:#5b6a63; margin:0; line-height:1.5; }
.cat-banner-media{
  margin-left:auto;
  width:280px; height:96px;
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
  .cat-banner-copy{ max-width:100%; }
  .cat-banner-media{ display:none; }
}

/* Category simple text header */
.category-header{ margin-bottom:22px; }
.category-header-title{ font-size:1.7rem; font-weight:700; color:#12261c; margin:0 0 4px; }
.category-header-desc{ font-size:.92rem; color:#5b6a63; margin:0; line-height:1.5; }

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
.subcat-group{ margin-bottom:28px; }
.subcat-group > .subcat-row:last-of-type{ border-bottom:none; }
.subcat-banner{ margin-bottom:10px; }
.subcat-banner-link{ margin-top:10px; }

/* Subcategory row */
.subcat-row{
  display:flex;
  gap:24px;
  padding:22px 0;
  border-bottom:1px solid #eef0f2;
  scroll-margin-top:16px;
}
.subcat-row:last-of-type{ border-bottom:none; }

.subcat-info{
  flex:0 0 220px;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:6px;
}
.subcat-info-icon{
  width:40px;height:40px;
  border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:4px;
  overflow:hidden;
}
.subcat-info-icon img{ width:100%;height:100%;object-fit:contain; }
.subcat-info-title{ font-size:1rem; font-weight:700; margin:0; color:#12261c; }
.subcat-info-desc{ font-size:.8rem; color:#7c848c; margin:0 0 4px; line-height:1.45; }
.subcat-info-link{
  font-size:.8rem;
  font-weight:600;
  text-decoration:none;
  padding:6px 14px;
  border:1px solid;
  border-radius:20px;
  display:inline-flex;
  align-items:center;
  gap:6px;
}

.subcat-scroll-wrap{ position:relative; flex:1 1 auto; min-width:0; }
.subcat-scroll{
  display:flex;
  gap:16px;
  overflow-x:auto;
  overflow-y:hidden;
  scroll-behavior:smooth;
  padding-bottom:4px;
  cursor:grab;
  -webkit-overflow-scrolling:touch;
  touch-action:pan-y; /* let vertical page scroll pass through, we own horizontal drag */
  overscroll-behavior-x:contain;
  /* hide the scrollbar itself while keeping the element scrollable */
  scrollbar-width:none;      /* Firefox */
  -ms-overflow-style:none;   /* old Edge / IE */
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
  border:1px solid #e0e3e7;
  background:#fff;
  font-size:1.1rem;
  line-height:1;
  color:#4a5158;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 6px rgba(20,30,25,.08);
  z-index:1;
}
.subcat-scroll-arrow--left{ left:-6px; }
.subcat-scroll-arrow--right{ right:-6px; }

.product-card{
  flex:0 0 160px;
  border:1px solid #edeff2;
  border-radius:10px;
  padding:14px;
  text-decoration:none;
  color:inherit;
  background:#fff;
  transition:box-shadow .15s ease, transform .15s ease;
}
.product-card:hover{ box-shadow:0 6px 18px rgba(20,30,25,.08); transform:translateY(-2px); }
.product-card--placeholder{ pointer-events:none; }
.product-card-img{
  width:100%; height:96px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:10px;
}
.product-card-img img{ max-width:100%; max-height:100%; object-fit:contain; }
.product-card-name{
  font-size:.8rem; font-weight:600; color:#1f2430;
  line-height:1.35; margin-bottom:6px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
  .product-card-company{ font-size:.72rem; color:#0a0b0c; margin-bottom:6px; }
.product-card-price{ font-size:.8rem; font-weight:600; color:#1c9a5b; margin-bottom:6px; }
.product-card-cta{ color:#2f6fed; }
.product-card-view{
  display:inline-flex; align-items:center; gap:5px;
  font-size:.72rem; color:#8a929c;
}

/* Trust bar */
.trust-bar{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
  background:#f7f8fa;
  border-radius:14px;
  padding:20px 24px;
  margin-top:28px;
}
@media (max-width:900px){ .trust-bar{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .trust-bar{ grid-template-columns:1fr; } }
.trust-item{ display:flex; align-items:flex-start; gap:12px; }
.trust-item-icon{ color:#1c9a5b; flex:0 0 auto; margin-top:2px; }
.trust-item-title{ font-size:.86rem; font-weight:700; color:#1f2430; }
.trust-item-subtitle{ font-size:.76rem; color:#8a929c; }
`;

export default SubCategory;
