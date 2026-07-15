import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ExcelExport from "../common/ExcelExport";
import API_BASE_URL from "../../config";

const ProductCategoryFormName = () => {
    const navigate = useNavigate();
    const excelExportRef = useRef();

    const [data, setData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("id");
    const [sortDirection, setSortDirection] = useState("DESC");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [excelData, setExcelData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/item_category/server-side`, {
                params: {
                    page,
                    limit,
                    search,
                    sortBy,
                    sort: sortDirection,
                    getDeleted: "false",
                    category_id: selectedCategory || undefined,
                    subcategory_id: selectedSubCategory || undefined,
                },
            });
            setData(response.data.data || []);
            setTotalRecords(response.data.totalRecords || 0);
            setFilteredRecords(response.data.filteredRecords || 0);
        } catch (error) {
            console.error("Error fetching item category data:", error);
            setData([]);
            setTotalRecords(0);
            setFilteredRecords(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, limit, search, sortBy, sortDirection, selectedCategory, selectedSubCategory]);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/item_category`, {
                params: {
                    getDeleted: "false",
                    category_id: selectedCategory || undefined,
                    subcategory_id: selectedSubCategory || undefined,
                },
            })
            .then((res) => {
                setExcelData(res.data || []);
            })
            .catch((err) => {
                console.error("Error fetching excel data:", err);
                setExcelData([]);
            });
    }, [selectedCategory, selectedSubCategory]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/categories`, {
                    params: { is_delete: 0, status: 1 },
                });
                setCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        if (!selectedCategory) {
            setSubCategories([]);
            setSelectedSubCategory("");
            return;
        }

        const fetchSubCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${selectedCategory}`);
                setSubCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching sub categories:", error);
                setSubCategories([]);
            }
        };

        fetchSubCategories();
    }, [selectedCategory]);

    const handleSortChange = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
        } else {
            setSortBy(column);
            setSortDirection("ASC");
        }
    };

    const getRangeText = () => {
        if (filteredRecords === 0) {
            if (search.trim()) {
                return `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`;
            }
            return "Showing 0 to 0 of 0 entries";
        }

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, filteredRecords);

        if (search.trim()) {
            return `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`;
        }

        return `Showing ${start} to ${end} of ${totalRecords} entries`;
    };

    const handleDownload = () => {
        if (excelExportRef.current) {
            excelExportRef.current.exportToExcel();
        }
    };

    return (
        <>
            <div className="page-wrapper">
                <div className="page-content">
                    <Breadcrumb
                        mainhead="Product Category Form"
                        maincount={totalRecords}
                        page="Category Master"
                        title="Product Category Form"
                        actions={
                            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}>
                                <i className="bx bx-download me-1" /> Excel
                            </button>
                        }
                    />

                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row g-3 mb-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label">Category Filter</label>
                                    <select
                                        className="form-select"
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setSelectedSubCategory("");
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Sub Category Filter</label>
                                    <select
                                        className="form-select"
                                        value={selectedSubCategory}
                                        onChange={(e) => {
                                            setSelectedSubCategory(e.target.value);
                                            setPage(1);
                                        }}
                                        disabled={!selectedCategory}
                                    >
                                        <option value="">All Sub Categories</option>
                                        {subCategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4 d-flex justify-content-md-end">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setSelectedCategory("");
                                            setSelectedSubCategory("");
                                            setPage(1);
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">

                            <DataTable
                                columns={[
                                    { key: "id", label: "S.No.", sortable: true },
                                    { key: "name", label: "Name", sortable: true },
                                    { key: "category_name", label: "Category", sortable: true },
                                    { key: "subcategory_name", label: "Sub Category", sortable: true },
                                    { key: "action", label: "Action", sortable: false },
                                ]}
                                data={data}
                                loading={loading}
                                page={page}
                                totalRecords={totalRecords}
                                filteredRecords={filteredRecords}
                                limit={limit}
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onPageChange={(newPage) => setPage(newPage)}
                                onSortChange={handleSortChange}
                                onSearchChange={(val) => {
                                    setSearch(val);
                                    setPage(1);
                                }}
                                search={search}
                                onLimitChange={(val) => {
                                    setLimit(val);
                                    setPage(1);
                                }}
                                getRangeText={getRangeText}
                                renderRow={(row, index) => (
                                    <tr key={row.id}>
                                        <td>{(page - 1) * limit + index + 1}</td>
                                        <td>{row.name}</td>
                                        <td>{row.category_name}</td>
                                        <td>{row.subcategory_name}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/item-category-form-builder?uuid=${encodeURIComponent(row.uuid || "")}`
                                                    )
                                                }
                                            >
                                                Manage Fields
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ExcelExport
                ref={excelExportRef}
                fileName="Product Category Form.xlsx"
                data={excelData}
                columns={[
                    { label: "Name", key: "name" },
                    { label: "Category", key: "category_name" },
                    { label: "Sub Category", key: "subcategory_name" },
                    { label: "Status", key: "getStatus" },
                    {
                        label: "Created At",
                        key: "created_at",
                        format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A"),
                    },
                    {
                        label: "Updated At",
                        key: "updated_at",
                        format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A"),
                    },
                ]}
            />
        </>
    );
};

export default ProductCategoryFormName;