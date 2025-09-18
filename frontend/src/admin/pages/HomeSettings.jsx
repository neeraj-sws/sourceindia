import React, { useEffect, useRef } from "react";
import Breadcrumb from '../common/Breadcrumb';
import AboutForm from '../forms/home/AboutForm';
import TopCategoriesForm from '../forms/home/TopCategoriesForm';
import WhyChooseForm from '../forms/home/WhyChooseForm';
import ProductSectionForm from '../forms/home/ProductSectionForm';
import CompanySectionForm from '../forms/home/CompanySectionForm';
import WorkSectionForm from '../forms/home/WorkSectionForm';
import TestimonialSectionForm from '../forms/home/TestimonialSectionForm';
import CounterSectionForm from '../forms/home/CounterSectionForm';
import ContactUsInformationForm from '../forms/home/ContactUsInformationForm';
import GetInTouchForm from '../forms/home/GetInTouchForm';
import FooterSectionForm from '../forms/home/FooterSectionForm';

const HomeSettings = () => {

  const navRef = useRef(null);
  const leftBtnRef = useRef(null);
  const rightBtnRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    const scrollLeftBtn = leftBtnRef.current;
    const scrollRightBtn = rightBtnRef.current;

    if (!nav || !scrollLeftBtn || !scrollRightBtn) return;

    const checkScrollButtons = () => {
      if (nav.scrollWidth > nav.clientWidth) {
        scrollLeftBtn.style.display = nav.scrollLeft > 0 ? "block" : "none";
        scrollRightBtn.style.display =
          nav.scrollLeft + nav.clientWidth < nav.scrollWidth ? "block" : "none";
      } else {
        scrollLeftBtn.style.display = "none";
        scrollRightBtn.style.display = "none";
      }
    };

    const handleLeftClick = () => {
      nav.scrollBy({ left: -200, behavior: "smooth" });
    };

    const handleRightClick = () => {
      nav.scrollBy({ left: 200, behavior: "smooth" });
    };

    const centerActiveTab = () => {
      const activeTab = nav.querySelector(".active");
      if (activeTab) {
        const navRect = nav.getBoundingClientRect();
        const activeRect = activeTab.getBoundingClientRect();
        const offset =
          activeRect.left -
          navRect.left -
          navRect.width / 2 +
          activeRect.width / 2;

        nav.scrollBy({ left: offset, behavior: "smooth" });
      }
    };

    scrollLeftBtn.addEventListener("click", handleLeftClick);
    scrollRightBtn.addEventListener("click", handleRightClick);
    nav.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    // Initial
    checkScrollButtons();
    centerActiveTab();

    // Handle tab clicks (Bootstrap’s pill switch)
    nav.addEventListener("click", (e) => {
      if (e.target.closest("li")) {
        setTimeout(centerActiveTab, 300);
      }
    });

    // Cleanup
    return () => {
      scrollLeftBtn.removeEventListener("click", handleLeftClick);
      scrollRightBtn.removeEventListener("click", handleRightClick);
      nav.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, []);




  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Settings" title="Home Settings" />
        <div className="col-xl-12 mx-auto">
          <div className='card mb-4 position-relative tabs-wrapper'>
            <div className='card-body py-0 px-1 wrapperBox'>
              <button id="scrollLeft" ref={leftBtnRef} className="scroll-btn left">
                <i class="lni lni-chevron-left"></i>
              </button>
              <ul ref={navRef} className="nav nav-pills customnavbar mx-3" role="tablist">
                <li className="nav-item" role="presentation">
                  <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-about" role="tab" aria-selected="true">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-info-circle font-18 me-1" /></div>
                      <div className="tab-title">About</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-category" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-category font-18 me-1" /></div>
                      <div className="tab-title">Top Categories</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-choose" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-check font-18 me-1" /></div>
                      <div className="tab-title">Why Choose</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-products" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-cart font-18 me-1" /></div>
                      <div className="tab-title">Product Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-company" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-building font-18 me-1" /></div>
                      <div className="tab-title">Company Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-work" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-task font-18 me-1" /></div>
                      <div className="tab-title">Work Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-testimonial" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bxs-quote-alt-left font-18 me-1" /></div>
                      <div className="tab-title">Testimonial Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-counter" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-calculator font-18 me-1" /></div>
                      <div className="tab-title">Counter Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-contact" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-envelope font-18 me-1" /></div>
                      <div className="tab-title">Contact Us Information</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-git" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-phone font-18 me-1" /></div>
                      <div className="tab-title">Get in Touch</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-footer" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-copyright font-18 me-1" /></div>
                      <div className="tab-title">Footer Section</div>
                    </div>
                  </a>
                </li>
              </ul>
              <button
                id="scrollRight"
                ref={rightBtnRef}
                className="scroll-btn right"
              >
                <i class="lni lni-chevron-right"></i>
              </button>
            </div>

          </div>
          <div className="card">
            <div className="card-body">
              <div className="tab-content" id="pills-tabContent">
                <div className="tab-pane fade show active" id="primary-pills-about" role="tabpanel">
                  <AboutForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-category" role="tabpanel">
                  <TopCategoriesForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-choose" role="tabpanel">
                  <WhyChooseForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-products" role="tabpanel">
                  <ProductSectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-company" role="tabpanel">
                  <CompanySectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-work" role="tabpanel">
                  <WorkSectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-testimonial" role="tabpanel">
                  <TestimonialSectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-counter" role="tabpanel">
                  <CounterSectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-contact" role="tabpanel">
                  <ContactUsInformationForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-git" role="tabpanel">
                  <GetInTouchForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-footer" role="tabpanel">
                  <FooterSectionForm />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default HomeSettings