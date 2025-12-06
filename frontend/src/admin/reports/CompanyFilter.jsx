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

const CompanyFilter = () => {
  const { showNotification } = useAlert();
  const [selectedCompanyLocation, setSelectedCompanyLocation] = useState("");
  const [selectedContactPerson, setSelectedContactPerson] = useState("");
  const [selectedBriefCompany, setSelectedBriefCompany] = useState("");
  const [selectedCompanyPhone, setSelectedCompanyPhone] = useState("");
  const [selectedCompanyWebsite, setSelectedCompanyWebsite] = useState("");
  const [selectedCompanyEmail, setSelectedCompanyEmail] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [coreActivities, setCoreActivities] = useState([]);
  const [selectedCoreActivities, setSelectedCoreActivities] = useState("");
  const [activities, setActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [range, setRange] = useState([
      { startDate: new Date(), endDate: new Date(), key: "selection" },
    ]);
    const datePickerRef = useRef(null);
    const excelExportRef = useRef();
    const [companyData, setCompanyData] = useState([]);
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

    axios.get(`${API_BASE_URL}/products/companies`)
      .then(res => {
        const filteredCompanies = res.data.companies.filter(company => company.is_delete === 0);
        setCompanies(filteredCompanies)
      })
      .catch(err => console.error("Error fetching companies:", err));

    axios.get(`${API_BASE_URL}/core_activities`)
      .then(res => {
        const filteredCoreActivities = res.data.filter(core_activity => core_activity.is_delete === 0);
        setCoreActivities(filteredCoreActivities)
      })
      .catch(err => console.error("Error fetching core activities:", err));
  }, []);

  // const handleCoreActivitiesChange = (event) => setSelectedCoreActivities(event.target.value);
  const handleCoreActivitiesChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCoreActivities(categoryId);
    setSelectedActivities("");
    if (categoryId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${categoryId}`);
        const filteredActivities = res.data.filter(subcategory => subcategory.is_delete === 0);
        setActivities(filteredActivities);
      } catch (err) {
        console.error("Error fetching sub categories:", err);
      }
    } else {
      setActivities([]);
    }
  };

  const handleActivitiesChange = (event) => setSelectedActivities(event.target.value);

  useEffect(() => {
    $("#company_location").select2({ theme: "bootstrap", width: "100%", placeholder: "Company Location" })
      .on("change", function () {
        setSelectedCompanyLocation($(this).val());
      });

    $("#contact_person").select2({ theme: "bootstrap", width: "100%", placeholder: "Contact Person" })
      .on("change", function () {
        setSelectedContactPerson($(this).val());
      });

    $("#brief_company").select2({ theme: "bootstrap", width: "100%", placeholder: "Brief Company" })
      .on("change", function () {
        setSelectedBriefCompany($(this).val());
      });

    $("#company_phone").select2({ theme: "bootstrap", width: "100%", placeholder: "Company Phone" })
      .on("change", function () {
        setSelectedCompanyPhone($(this).val());
      });

    $("#company_website").select2({ theme: "bootstrap", width: "100%", placeholder: "Company Website" })
      .on("change", function () {
        setSelectedCompanyWebsite($(this).val());
      });

    $("#company_email").select2({ theme: "bootstrap", width: "100%", placeholder: "Company Email" })
      .on("change", function () {
        setSelectedCompanyEmail($(this).val());
      });

    $("#core_activity").select2({ theme: "bootstrap", width: "100%", placeholder: "Select Core Activity" })
      .on("change", function () {
        handleCoreActivitiesChange({ target: { value: $(this).val() } });
      });

    $("#activity").select2({ theme: "bootstrap", width: "100%", placeholder: "Select Activity" })
      .on("change", function () {
        handleActivitiesChange({ target: { value: $(this).val() } });
      });

    $("#organization_name").select2({ theme: "bootstrap", width: "100%", placeholder: "Company" })
      .on("change", function () {
        setSelectedCompanies($(this).val());
      });

    return () => {
      $("#company_location, #contact_person, #brief_company, #company_phone, #company_website, #company_email, #core_activity, #activity, #organization_name")
  .each(function () {
    if ($(this).data('select2')) {   // only destroy if initialized
      $(this).select2('destroy');
    }
  })
  .off("change");
    };
  }, [companies, coreActivities, activities]);

  useEffect(() => {
  if (companyData.length > 0) {
    excelExportRef.current.exportToExcel();
  }
}, [companyData]);

    const handleExport = async () => {
  try {
    const params = {};

    if (selectedCompanyLocation) params.company_location = selectedCompanyLocation;
    if (selectedContactPerson) params.contact_person = selectedContactPerson;
    if (selectedBriefCompany) params.brief_company = selectedBriefCompany;
    if (selectedCompanyPhone) params.company_phone = selectedCompanyPhone;
    if (selectedCompanyWebsite) params.company_website = selectedCompanyWebsite;
    if (selectedCompanyEmail) params.company_email = selectedCompanyEmail;
    if (selectedCompanies) params.organization_name = selectedCompanies;
    if (selectedCoreActivities) params.core_activity = selectedCoreActivities;
    if (selectedActivities) params.activity = selectedActivities;

    // Only apply date filter if user selected it
    if (userHasSelectedDate) {
      params.dateRange = "customrange";
      params.startDate = format(range[0].startDate, "yyyy-MM-dd");
      params.endDate = format(range[0].endDate, "yyyy-MM-dd");
    }

    const res = await axios.get(`${API_BASE_URL}/products/companies_filtered`, { params });

    if (!res.data.length) {
      showNotification("No data found for export.", "warning");
      return; // stop here (do not export)
    }

    setCompanyData(res.data);

    excelExportRef.current.exportToExcel();

  } catch (err) {
    console.error("Export Error:", err);
  }
};

const handleClear = () => {
  // Reset all selected values
  setCompanyData([]);
  setSelectedCompanyLocation("");
  setSelectedContactPerson("");
  setSelectedBriefCompany("");
  setSelectedCompanyPhone("");
  setSelectedCompanyWebsite("");
  setSelectedCompanyEmail("");
  setSelectedCompanies("");
  setSelectedCoreActivities("");
  setSelectedActivities("");
  setActivities([]);

  // Reset Date Range
  setUserHasSelectedDate(false);
  setRange([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Reset Select2 dropdowns
  $("#company_location").val("").trigger("change");
  $("#contact_person").val("").trigger("change");
  $("#brief_company").val("").trigger("change");
  $("#company_phone").val("").trigger("change");
  $("#company_website").val("").trigger("change");
  $("#company_email").val("").trigger("change");
  $("#organization_name").val("").trigger("change");
  $("#core_activity").val("").trigger("change");
  $("#activity").val("").trigger("change");
};

  return (
    <>
    <div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Company Filter</h5>
      <div className="col-md-3">
        <select id="organization_name" className="form-control select2" value={selectedCompanies} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(c => (
            <option key={c.id} value={c.organization_name}>{c.organization_name}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="company_location" className="form-control select2" value={selectedCompanyLocation} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.company_location}>{s.company_location}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="contact_person" className="form-control select2" value={selectedContactPerson} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.contact_person}>{s.contact_person}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="brief_company" className="form-control select2" value={selectedBriefCompany} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.brief_company}>{s.brief_company}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="company_phone" className="form-control select2" value={selectedCompanyPhone} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.company_phone}>{s.company_phone}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="company_website" className="form-control select2" value={selectedCompanyWebsite} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.company_website}>{s.company_website}</option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <select id="company_email" className="form-control select2" value={selectedCompanyEmail} onChange={() => {}}>
          <option value="">All</option>
          {companies.map(s => (
            <option key={s.id} value={s.company_email}>{s.company_email}</option>
          ))}
        </select>
      </div>
      {/* <div className="col-md-3">
        <select id="companyMemberRole" className="form-select">
          <option value="">Member Role</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div> */}
      <div className="col-md-3">
          <select id="core_activity" className="form-control select2" value={selectedCoreActivities} onChange={handleCoreActivitiesChange}>
              <option value="">All</option>
              {coreActivities.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
      </div>
      <div className="col-md-3">
          <select id="activity" className="form-control select2" value={selectedActivities} onChange={handleActivitiesChange}>
              <option value="">All</option>
              {activities.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
      </div>
      {/* <div className="col-md-3">
        <select id="companySegment" className="form-select">
          <option value="">Select Segment</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companySubSegment" className="form-select">
          <option value="">Select Sub Segment</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div> */}
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
            fileName="Company.xlsx"
            data={companyData}
            columns={[
              { label: "Company Name", key: "organization_name" },
              { label: "Company Location", key: "company_location" },
              { label: "Contact Person", key: "contact_person" },
              { label: "Brief Company", key: "brief_company" },
              { label: "Company Phone", key: "company_phone" },
              { label: "Company Website", key: "company_website" },
              { label: "Company Email", key: "company_email" },
              { label: "Core Activity", key: "coreactivity_name" },
              { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
            ]}
          />
          </>
  )
}

export default CompanyFilter