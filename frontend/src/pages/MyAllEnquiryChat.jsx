import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../admin/common/Breadcrumb";
import DataTable from "../admin/common/DataTable";
import API_BASE_URL from "./../config";
import { useAlert } from "./../context/AlertContext";
import { formatDateTime } from './../utils/formatDate';
import LeadsModals from "../admin/pages/modal/LeadsModals";
import ExcelExport from "../admin/common/ExcelExport";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import UseAuth from '../sections/UseAuth';

const MyAllEnquiryChat = ({ user_id }) => {
  const navigate = useNavigate();
  const { user, loading } = UseAuth();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { showNotification } = useAlert();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [enquiriesToDelete, setEnquiriesToDelete] = useState(null);
  const [enquiriesData, setEnquiriesData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: 'selection' }
  ]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [appliedSubCategory, setAppliedSubCategory] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [tempEnquiryNo, setTempEnquiryNo] = useState("");
  const [counterCount, setcounterCount] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    try {
      if (categoryId) {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${categoryId}`);
        setSubCategories(res.data);
      } else {
        setSubCategories([]);
      }
      setSelectedSubCategory("");
    } catch (err) {
      console.error("Error fetching sub categories:", err);
    }
  };

  const handleSubCategoryChange = (event) => { setSelectedSubCategory(event.target.value); };

  useEffect(() => {
    $("#category").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Category",
    })
      .on("change", function () {
        handleCategoryChange({ target: { value: $(this).val() } });
      });
    $("#sub_category").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Sub Category",
    })
      .on("change", function () {
        handleSubCategoryChange({ target: { value: $(this).val() } });
      });
    return () => {
      const $category = $("#category");
      const $subCategory = $("#sub_category");
      if ($category.data('select2')) {
        $category.off("change").select2("destroy");
      }
      if ($subCategory.data('select2')) {
        $subCategory.off("change").select2("destroy");
      }
    };
  }, [categories, subCategories]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/enquiries/by-enquiry`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection, user_id: user?.id || null,
        },
      });

      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (!user || loading) return; fetchData(); },
    [page, limit, search, sortBy, sortDirection, user
    ]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection == "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    const isFiltered = search.trim() || dateRange || (startDate && endDate);
    if (filteredRecords === 0) {
      return isFiltered
        ? `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`
        : "Showing 0 to 0 of 0 entries";
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return isFiltered
      ? `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`
      : `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const openDeleteModal = (enquiriesId) => { setEnquiriesToDelete(enquiriesId); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setEnquiriesToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/enquiries/${enquiriesToDelete}/delete_status`);
      setData((prevData) => prevData.filter((item) => item.id !== enquiriesToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Enquiry deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Enquiry:", error);
      showNotification("Failed to delete Enquiry.", "error");
    }
  };
  useEffect(() => {
    if (!user?.id || !user?.company_id) return; // wait until user info is ready

    // Fetch user's enquiries
    axios.get(`${API_BASE_URL}/enquiries/by-enquiry?user_id=${user.id}&all=true`)
      .then((res) => {
        const filtered = res.data.data.filter((c) => c.is_approve === 1 && c.is_delete === 0);
        setEnquiriesData(filtered);
      })
      .catch((err) => console.error("Error fetching enquiries:", err));

    // Fetch lead count
    axios.get(`${API_BASE_URL}/enquiries/lead-count?companyId=${user.company_id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => {
        const counts = res.data?.data || res.data || { total: 0, open: 0, closed: 0 };
        setcounterCount(counts);
        console.log("Lead Counts:", counts);
      })
      .catch((err) => {
        console.error("Error fetching lead count:", err);
        setcounterCount({ total: 0, open: 0, closed: 0 }); // fallback
      });

  }, [user?.company_id]);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, 'yyyy-MM-dd'));
    setTempEndDate(format(end, 'yyyy-MM-dd'));
    setShowPicker(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Enquiry Chat"
          />


        </div>
      </div>

    </>
  );
};

export default MyAllEnquiryChat;