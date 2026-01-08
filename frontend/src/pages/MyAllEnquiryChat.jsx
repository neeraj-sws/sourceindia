import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../admin/common/Breadcrumb";
import DataTable from "../admin/common/DataTable";
import API_BASE_URL, { ROOT_URL } from "./../config";
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
  const [allleads, setAllLeads] = useState([]);
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [enquiryMessages, setEnquiryMessages] = useState([]);
  const [enquiryUsers, setEnquiryUsers] = useState(null);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const loggedCompanyId = user?.id;

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

    // Fetch lead chat
    axios.get(`${API_BASE_URL}/enquiries/all-leads?companyId=${user.company_id}&is_type=myenquiry`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => {
        const response = res.data?.data;

        setAllLeads(response);
      })
      .catch((err) => {
        console.error("Error fetching lead count:", err);
        setAllLeads(null); // fallback
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

  useEffect(() => {
    if (allleads && allleads.length > 0) {
      const first = allleads[0];

      enquiry_message_data(
        first.enquiry_id,
        first.buyer_company_id
      );
    }
  }, [allleads]);

  const enquiry_message_data = async (enq_id, buyer_company_id) => {
    try {
      setActiveEnquiry(enq_id); // active highlight
      setChatLoading(true);
      const res = await axios.get(`${API_BASE_URL}/enquiries/messages`, {
        params: {
          enq_id,
          buyer_company_id
        }
      });

      setEnquiryMessages(res.data.data || []);
      setEnquiryUsers(res.data.user || null);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeEnquiry) return;


    try {
      const payload = {
        enquiry_id: activeEnquiry,
        message: message,
        user: user
      };

      const res = await axios.post(
        `${API_BASE_URL}/enquiries/send-message`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      // UI me turant message add
      if (res.data?.data) {

        setEnquiryMessages((prev) => [...prev, res.data.data]);

      }

      setMessage("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };



  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Enquiry Chat"
          />
          {allleads && allleads.length > 0 && (
            <div className="row">
              <div className="col-4">
                <div className="card border">
                  <div className="card-header">
                    <h6 className="mb-0">Chat</h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="allMessages">
                      {allleads.map(item => (
                        <a
                          key={item.enquiry_id}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            enquiry_message_data(item.enquiry_id, item.buyer_company_id);
                          }}
                          className={`text-dark border-bottom d-block p-3 
      ${activeEnquiry === item.enquiry_id ? 'active' : ''}`}
                        >
                          <div className="d-flex gap-2">
                            <div className="chat_user">
                              <img
                                src={item.file || "/user-demo.png"}
                                alt="" className="img-fluid img-thumbnail" width="40"
                              />
                            </div>

                            <div className="menquiry">
                              <b> Enquiry :</b>
                              <span>{item.enquiry_number}</span>
                              <p className="mb-0"><b>User :</b> {item.fname} {item.lname}</p>
                              <p className="mb-0"><b>Company :</b> {item.organization_name}</p>
                            </div>
                          </div>
                        </a>
                      ))}


                    </div>
                  </div>
                </div>
              </div>
              <div className="col-8">
                <div className="card mb-3 border">
                  <div className="card-body">
                    <div className="MainChat">
                      <div class="chat-header d-flex align-items-center start-0">

                        <div>
                          {/* <h4 class="mb-1 font-weight-bold">{enquiryUsers?.fname} {enquiryUsers?.lname}</h4> */}
                          <h4 class="mb-1 font-weight-bold">Conversation</h4>

                        </div>

                      </div>
                      <div className="chat-content ps ps--active-y start-0 m-0 mb-4">

                        {chatLoading ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading conversation...</p>
                          </div>
                        ) : enquiryMessages.length > 0 ? (

                          enquiryMessages.map((msg, index) => {
                            const time = new Date(msg.updated_at).toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true
                            });

                            return (
                              <div key={index}>
                                {/* LEFT SIDE */}
                                {msg.user_id !== loggedCompanyId && (
                                  <div className="chat-content-leftside">
                                    <div className="d-flex">
                                      <img
                                        src={
                                          msg.user_file
                                            ? `${ROOT_URL}/${msg.user_file}`
                                            : "/user-demo.png"
                                        }


                                        width="40"
                                        height="40"
                                        className="rounded-circle border"
                                        style={{ objectFit: "cover" }}
                                        alt=""
                                        onError={(e) => {
                                          e.target.onerror = null; // prevent infinite loop
                                          e.target.src = "/user-demo.png";
                                        }}
                                      />
                                      <div className="flex-grow-1 ms-2">
                                        <p className="mb-0 chat-time">
                                          {msg.user_fname} {msg.user_lname}, {time}
                                        </p>
                                        <p className="chat-left-msg">{msg.message}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* RIGHT SIDE */}
                                {msg.user_id == loggedCompanyId && (
                                  <div className="chat-content-rightside">
                                    <div className="d-flex ms-auto">
                                      <div className="flex-grow-1 me-2">
                                        <p className="mb-0 chat-time text-end">
                                          {msg.seller_fname} {msg.seller_lname}, {time}
                                        </p>
                                        <p className="chat-right-msg">{msg.message}</p>
                                      </div>
                                      <img
                                        src={
                                          msg.seller_file
                                            ? `${ROOT_URL}/${msg.seller_file}`
                                            : "/user-demo.png"
                                        }
                                        width="40"
                                        height="40"
                                        className="rounded-circle border"
                                        style={{ objectFit: "cover" }}
                                        alt=""
                                        onError={(e) => {
                                          e.target.onerror = null; // prevent infinite loop
                                          e.target.src = "/user-demo.png";
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })

                        ) : (
                          <p className="text-center text-muted mt-4">
                            No messages found
                          </p>
                        )}

                      </div>

                      <div className="chat-footer d-flex align-items-center start-0">
                        <div className="flex-grow-1 pe-2">
                          <div className="input-group">	<span className="input-group-text"><i className="bx bx-envelope"></i></span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Type a message"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            />

                            <button
                              className="btn btn-primary"
                              onClick={handleSendMessage}
                              disabled={!message.trim()}
                            >
                              Send
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div >
      </div >

    </>
  );
};

export default MyAllEnquiryChat;