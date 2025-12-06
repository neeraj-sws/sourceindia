import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import API_BASE_URL from "../../config";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import ExcelExport from "../common/ExcelExport";
import { useAlert } from "../../context/AlertContext";

const ProductFilter = () => {
  const { showNotification } = useAlert();
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedArticleNumber, setSelectedArticleNumber] = useState("");
  const [selectedProductService, setSelectedProductService] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [isGold, setIsGold] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [bestProduct, setBestProduct] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [range, setRange] = useState([
      { startDate: new Date(), endDate: new Date(), key: "selection" },
    ]);
    const datePickerRef = useRef(null);
    const excelExportRef = useRef();
    const [productData, setProductData] = useState([]);
    const [userHasSelectedDate, setUserHasSelectedDate] = useState(false);
      
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
            setShowPicker(false);
        }
        };
        if (showPicker) {
        document.addEventListener("mousedown", handleClickOutside);
        } else {
        document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    const handleRangeChange = (item) => {
        setRange([item.selection]);
        setUserHasSelectedDate(true);
        setShowPicker(false);
    };

  useEffect(() => {

    axios.get(`${API_BASE_URL}/products`)
      .then(res => {
        const filteredProducts = res.data.products.filter(product => product.is_delete === 0);
        setProducts(filteredProducts)
      })
      .catch(err => console.error("Error fetching products:", err));

    axios.get(`${API_BASE_URL}/products/companies`)
      .then(res => {
        const filteredCompanies = res.data.companies.filter(company => company.is_delete === 0);
        setCompanies(filteredCompanies)
      })
      .catch(err => console.error("Error fetching companies:", err));

    axios.get(`${API_BASE_URL}/sellers`)
      .then(res => {
        const filteredSellers = res.data.filter(seller => seller.is_delete === 0);
        setSellers(filteredSellers)
      })
      .catch(err => console.error("Error fetching users:", err));

    axios.get(`${API_BASE_URL}/categories`)
      .then(res => {
        const filteredCategories = res.data.filter(category => category.is_delete === 0);
        setCategories(filteredCategories)
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const handleCategoryChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubCategory("");
    if (categoryId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${categoryId}`);
        const filteredSubCategories = res.data.filter(subcategory => subcategory.is_delete === 0);
        setSubCategories(filteredSubCategories);
      } catch (err) {
        console.error("Error fetching sub categories:", err);
      }
    } else {
      setSubCategories([]);
    }
  };

  const handleSubCategoryChange = (event) => setSelectedSubCategory(event.target.value);

  useEffect(() => {
    $("#code").select2({ theme: "bootstrap", width: "100%", placeholder: "Code" })
      .on("change", function () {
        setSelectedCode($(this).val());
      });

    $("#article_number").select2({ theme: "bootstrap", width: "100%", placeholder: "Article Number" })
      .on("change", function () {
        setSelectedArticleNumber($(this).val());
      });

    $("#product_service").select2({ theme: "bootstrap", width: "100%", placeholder: "Product Service" })
      .on("change", function () {
        setSelectedProductService($(this).val());
      });

    $("#product_title").select2({ theme: "bootstrap", width: "100%", placeholder: "Product Name" })
      .on("change", function () {
        setSelectedProducts($(this).val());
      });

    $("#company_id2").select2({ theme: "bootstrap", width: "100%", placeholder: "Company" })
      .on("change", function () {
        setSelectedCompanies($(this).val());
      });

    $("#user_id").select2({ theme: "bootstrap", width: "100%", placeholder: "User Name" })
      .on("change", function () {
        setSelectedSeller($(this).val());
      });

    $("#category").select2({ theme: "bootstrap", width: "100%", placeholder: "All Category" })
      .on("change", function () {
        handleCategoryChange({ target: { value: $(this).val() } });
      });

    $("#sub_category").select2({ theme: "bootstrap", width: "100%", placeholder: "All Sub Category" })
      .on("change", function () {
        handleSubCategoryChange({ target: { value: $(this).val() } });
      });

    return () => {
      $("#code, #article_number, #product_service, #product_title, #company_id2, #user_id, #category, #sub_category")
  .each(function () {
    if ($(this).data('select2')) {   // only destroy if initialized
      $(this).select2('destroy');
    }
  })
  .off("change");
    };
  }, [products, companies, sellers, categories, subCategories]);

  useEffect(() => {
  if (productData.length > 0) {
    excelExportRef.current.exportToExcel();
  }
}, [productData]);

    const handleExport = async () => {
  try {
    const params = {};

    if (selectedCode) params.code = selectedCode;
    if (selectedArticleNumber) params.article_number = selectedArticleNumber;
    if (selectedProductService) params.product_service = selectedProductService;
    if (selectedProducts) params.title = selectedProducts;
    if (selectedCategory) params.category_name = selectedCategory.target?.value;
    if (selectedSubCategory) params.sub_category_name = selectedSubCategory.target?.value;
    if (selectedCompanies) params.company_id = selectedCompanies;
    if (selectedSeller) params.user_id = selectedSeller;
    if (isGold) params.is_gold = 1;
    if (isFeatured) params.is_featured = 1;
    if (isRecommended) params.is_recommended = 1;
    if (bestProduct) params.best_product = 1;

    // Only apply date filter if user selected it
    if (userHasSelectedDate) {
      params.dateRange = "customrange";
      params.startDate = format(range[0].startDate, "yyyy-MM-dd");
      params.endDate = format(range[0].endDate, "yyyy-MM-dd");
    }

    const res = await axios.get(`${API_BASE_URL}/products/filtered`, { params });

    if (!res.data.length) {
      showNotification("No data found for export.", "warning");
      return; // stop here (do not export)
    }

    setProductData(res.data);

    excelExportRef.current.exportToExcel();

  } catch (err) {
    console.error("Export Error:", err);
  }
};

const handleClear = () => {
  // Reset all filter states
  setProductData([]);
  setSelectedCode("");
  setSelectedArticleNumber("");
  setSelectedProductService("");
  setSelectedProducts("");
  setSelectedCompanies("");
  setSelectedSeller("");
  setSelectedCategory("");
  setSelectedSubCategory("");
  setSubCategories([]);
  setIsGold(false);
  setIsFeatured(false);
  setIsRecommended(false);
  setBestProduct(false);

  setUserHasSelectedDate(false);
  setRange([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Reset Select2 dropdowns
  $("#code").val("").trigger("change");
  $("#article_number").val("").trigger("change");
  $("#product_service").val("").trigger("change");
  $("#product_title").val("").trigger("change");
  $("#company_id2").val("").trigger("change");
  $("#user_id").val("").trigger("change");
  $("#category").val("").trigger("change");
  $("#sub_category").val("").trigger("change");
};

  return (
    <>
    <div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Product Filter</h5>
      <div className="col-md-3">
        <select id="product_title" className="form-control select2" value={selectedProducts} onChange={() => {}}>
          <option value="">All</option>
          {products.map(c => (
            <option key={c.id} value={c.title}>{c.title}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="user_id" className="form-control select2" value={selectedSeller} onChange={() => {}}>
          <option value="">All</option>
          {sellers.map(s => (
            <option key={s.id} value={s.id}>{s.fname} {s.lname}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
                <select id="category" className="form-control select2" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">All</option>
                    {categories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
                <select id="sub_category" className="form-control select2" value={selectedSubCategory} onChange={handleSubCategoryChange}>
                    <option value="">All</option>
                    {subCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
      <div className="col-md-3">
            <select id="company_id2" className="form-control select2" value={selectedCompanies} onChange={() => {}}>
              <option value="">All</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.organization_name}</option>
              ))}
            </select>
          </div>
      <div className="col-md-3">
        <select id="code" className="form-control select2" value={selectedCode} onChange={() => {}}>
          <option value="">All</option>
          {products.map(s => (
            <option key={s.id} value={s.code}>{s.code}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="article_number" className="form-control select2" value={selectedArticleNumber} onChange={() => {}}>
          <option value="">All</option>
          {products.map(s => (
            <option key={s.id} value={s.article_number}>{s.article_number}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="product_service" className="form-control select2" value={selectedProductService} onChange={() => {}}>
          <option value="">All</option>
          {products.map(s => (
            <option key={s.id} value={s.product_service}>{s.product_service}</option>
          ))}
        </select>
      </div>
      <div className="col-md-4">
                        <div className="position-relative">
                          <button
                            type="button"
                            className="form-control text-start"
                            onClick={() => setShowPicker(!showPicker)}
                          >
                            <i className="bx bx-calendar me-2"></i>
                            {format(range[0].startDate, "MMMM dd, yyyy")} -{" "}
                            {format(range[0].endDate, "MMMM dd, yyyy")}
                          </button>
                          {showPicker && (
                            <div
                              ref={datePickerRef}
                              className="position-absolute z-3 bg-white shadow p-3 rounded"
                              style={{ top: "100%", left: 0, minWidth: "300px" }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">Select Date Range</h6>
                                <button
                                  type="button"
                                  className="btn-close"
                                  onClick={() => setShowPicker(false)}
                                ></button>
                              </div>
                              <DateRangePicker
                                ranges={range}
                                onChange={handleRangeChange}
                                showSelectionPreview
                                moveRangeOnFirstSelection={false}
                                editableDateInputs
                              />
                              <div className="text-end mt-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => setShowPicker(false)}
                                >
                                    Close
                                </button>
                                </div>
                            </div>
                          )}
                        </div>
                      </div>
      <div className="col-md-8">
        <div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="goldCheckbox"
    checked={isGold}
    onChange={() => setIsGold(!isGold)}
  />
  <label className="form-check-label" htmlFor="goldCheckbox">Gold</label>
</div>

<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="featuredCheckbox"
    checked={isFeatured}
    onChange={() => setIsFeatured(!isFeatured)}
  />
  <label className="form-check-label" htmlFor="featuredCheckbox">Featured</label>
</div>

<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="recommendedCheckbox"
    checked={isRecommended}
    onChange={() => setIsRecommended(!isRecommended)}
  />
  <label className="form-check-label" htmlFor="recommendedCheckbox">Recommended</label>
</div>

<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="bestCheckbox"
    checked={bestProduct}
    onChange={() => setBestProduct(!bestProduct)}
  />
  <label className="form-check-label" htmlFor="bestCheckbox">Best Product</label>
</div>
      </div>
      <div className="col-12 d-flex justify-content-end gap-2">
  <button
    type="button"
    className="btn btn-info btn-sm px-5 text-light"
    onClick={handleExport}
  >
    Export
  </button>
  <button
    type="button"
    className="btn btn-secondary btn-sm px-5"
    onClick={handleClear}
  >
    Clear
  </button>
</div>
    </form>
  </div>
</div>
<ExcelExport
            ref={excelExportRef}
            columnWidth={34.29}
            fileName="Product.xlsx"
            data={productData}
            columns={[
              { label: "Product Name", key: "title" },
              { label: "User Name", key: "user_name" },
              { label: "Category", key: "category_name" },
              { label: "Sub Category", key: "subcategory_name" },
              { label: "Company Name", key: "company_name" },
              { label: "Code", key: "code" },
              { label: "Article Number", key: "article_number" },
              { label: "Product Service", key: "product_service_name" },
              { label: "Gold", key: "is_gold" },
              { label: "Featured", key: "is_featured" },
              { label: "Recommended", key: "is_recommended" },
              { label: "Best Product", key: "best_product" },
              { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
            ]}
          />
</>
  )
}

export default ProductFilter