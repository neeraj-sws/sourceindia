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

const EnquiryFilter = () => {
  const { showNotification } = useAlert();
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiries, setSelectedEnquiries] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [range, setRange] = useState([
      { startDate: new Date(), endDate: new Date(), key: "selection" },
    ]);
    const datePickerRef = useRef(null);
    const excelExportRef = useRef();
    const [enquiryData, setEnquiryData] = useState([]);
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

    axios.get(`${API_BASE_URL}/enquiries`)
  .then(res => {
    const filteredEnquiries = res.data.filter(enquiry => enquiry.is_delete === 0);
    setEnquiries(filteredEnquiries);
  })
  .catch(err => console.error("Error fetching enquiries:", err));

    axios.get(`${API_BASE_URL}/products/companies`)
      .then(res => {
        const filteredCompanies = res.data.companies.filter(company => company.is_delete === 0);
        setCompanies(filteredCompanies)
      })
      .catch(err => console.error("Error fetching companies:", err));
  }, []);

  useEffect(() => {
    $("#enquiry_number").select2({ theme: "bootstrap", width: "100%", placeholder: "Enquiry Number" })
      .on("change", function () {
        setSelectedEnquiries($(this).val());
      });

    $("#company_id3").select2({ theme: "bootstrap", width: "100%", placeholder: "Company" })
      .on("change", function () {
        setSelectedCompanies($(this).val());
      });

    $("#category_name").select2({ theme: "bootstrap", width: "100%", placeholder: "All Category" })
      .on("change", function () {
        setSelectedCategory({ target: { value: $(this).val() } });
      });

    $("#sub_category_name").select2({ theme: "bootstrap", width: "100%", placeholder: "All Sub Category" })
      .on("change", function () {
        setSelectedSubCategory({ target: { value: $(this).val() } });
      });

    return () => {
      $("#enquiry_number, #company_id3, #user_id, #category_name, #sub_category_name")
  .each(function () {
    if ($(this).data('select2')) {   // only destroy if initialized
      $(this).select2('destroy');
    }
  })
  .off("change");
    };
  }, [enquiries, companies]);

  useEffect(() => {
  if (enquiryData.length > 0) {
    excelExportRef.current.exportToExcel();
  }
}, [enquiryData]);

    const handleExport = async () => {
  try {
    const params = {};

    if (selectedEnquiries) params.enquiry_number = selectedEnquiries;
    if (selectedCategory) params.category_name = selectedCategory.target?.value;
    if (selectedSubCategory) params.sub_category_name = selectedSubCategory.target?.value;
    if (selectedCompanies) params.company_id = selectedCompanies;

    // Only apply date filter if user selected it
    if (userHasSelectedDate) {
      params.dateRange = "customrange";
      params.startDate = format(range[0].startDate, "yyyy-MM-dd");
      params.endDate = format(range[0].endDate, "yyyy-MM-dd");
    }

    const res = await axios.get(`${API_BASE_URL}/enquiries/filtered`, { params });

    if (!res.data.length) {
      showNotification("No data found for export.", "warning");
      return; // stop here (do not export)
    }

    setEnquiryData(res.data);

    excelExportRef.current.exportToExcel();

  } catch (err) {
    console.error("Export Error:", err);
  }
};

const handleClear = () => {
  // Reset all states
  setEnquiryData([]);
  setSelectedEnquiries("");
  setSelectedCompanies("");
  setSelectedCategory("");
  setSelectedSubCategory("");
  setUserHasSelectedDate(false);

  setRange([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Reset Select2 dropdowns
  $("#enquiry_number").val("").trigger("change");
  $("#company_id3").val("").trigger("change");
  $("#category_name").val("").trigger("change");
  $("#sub_category_name").val("").trigger("change");
};

  return (
    <>
    <div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Enquiry Filter</h5>
      <div className="col-md-3">
        <select id="enquiry_number" className="form-control select2" value={selectedEnquiries} onChange={() => {}}>
          <option value="">All</option>
          {enquiries.map(c => (
            <option key={c.id} value={c.enquiry_number}>{c.enquiry_number}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
                <select id="category_name" className="form-control select2" value={selectedCategory} onChange={() => {}}>
                    <option value="">All</option>
                    {enquiries.map((s) => (
                    <option key={s.id} value={s.category_name}>{s.category_name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
                <select id="sub_category_name" className="form-control select2" value={selectedSubCategory} onChange={() => {}}>
                    <option value="">All</option>
                    {enquiries.map((c) => (
                    <option key={c.id} value={c.sub_category_name}>{c.sub_category_name}</option>
                    ))}
                </select>
            </div>
      <div className="col-md-3">
            <select id="company_id3" className="form-control select2" value={selectedCompanies} onChange={() => {}}>
              <option value="">All</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.organization_name}</option>
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
            fileName="Enquiry.xlsx"
            data={enquiryData}
            columns={[
              { label: "Enquiry Number", key: "enquiry_number" },
              { label: "Category", key: "category_name" },
              { label: "Sub Category", key: "sub_category_name" },
              { label: "Company Name", key: "company_name" },
              { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
            ]}
          />
</>
  )
}

export default EnquiryFilter