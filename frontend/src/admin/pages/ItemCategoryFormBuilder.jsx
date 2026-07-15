import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../common/Breadcrumb";
import API_BASE_URL from "../../config";

const INPUT_TYPES = [
    "text",
    "number",
    "decimal",
    "textarea",
    "radio",
    "checkbox",
    "select",
    "multiselect",
    "date",
    "email",
    "url",
];

const OPTION_BASED_TYPES = ["radio", "checkbox", "select", "multiselect"];

const TYPE_BADGE_CLASS = {
    text: "bg-primary-subtle text-primary border",
    number: "bg-info-subtle text-info border",
    decimal: "bg-info-subtle text-info border",
    textarea: "bg-warning-subtle text-warning border",
    radio: "bg-success-subtle text-success border",
    checkbox: "bg-success-subtle text-success border",
    select: "bg-secondary-subtle text-secondary border",
    multiselect: "bg-secondary-subtle text-secondary border",
    date: "bg-danger-subtle text-danger border",
    email: "bg-dark-subtle text-dark border",
    url: "bg-dark-subtle text-dark border",
};

const slugifyKey = (value) =>
    (value || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const prettifyInputType = (value) => {
    if (!value) return "-";
    if (value.toLowerCase() === "multiselect") return "Multi Select";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const capitalizeFirst = (value) => {
    const txt = (value || "").toString().trim();
    if (!txt) return "";
    return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const ItemCategoryFormBuilder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);

    const prefilledUuid = query.get("uuid") || "";

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [itemCategories, setItemCategories] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedItemCategory, setSelectedItemCategory] = useState("");
    const [selectedSubCategoryLabel, setSelectedSubCategoryLabel] = useState("");

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [loadingItemCategories, setLoadingItemCategories] = useState(false);

    const [fields, setFields] = useState([]);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState(null);
    const [editingFieldId, setEditingFieldId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [fieldKeyTouched, setFieldKeyTouched] = useState(false);
    const [savingField, setSavingField] = useState(false);
    const [loadingFields, setLoadingFields] = useState(false);
    const [filterInputType, setFilterInputType] = useState("all");
    const [hideInactiveFields, setHideInactiveFields] = useState(false);
    const [fieldForm, setFieldForm] = useState({
        label: "",
        key: "",
        inputType: "text",
        required: false,
        placeholder: "",
        defaultValue: "",
        helpText: "",
        displayOrder: 1,
        isActive: true,
        options: [],
    });

    useEffect(() => {
        if (!prefilledUuid) return;

        const fetchByUuid = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/item_category`, {
                    params: { getDeleted: "false" },
                });
                const allItems = res.data || [];
                const matched = allItems.find((item) => String(item.uuid) === String(prefilledUuid));

                if (!matched) return;

                setSelectedCategory(String(matched.category_id || ""));
                setSelectedSubCategory(String(matched.subcategory_id || ""));
                setSelectedItemCategory(String(matched.id || ""));
                setSelectedSubCategoryLabel(matched.subcategory_name || "");
            } catch (error) {
                console.error("Error resolving item category by uuid:", error);
            }
        };

        fetchByUuid();
    }, [prefilledUuid]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/categories`, {
                    params: { is_delete: 0, status: 1 },
                });
                setCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        if (!selectedCategory) {
            setSubCategories([]);
            setSelectedSubCategory("");
            setItemCategories([]);
            setSelectedItemCategory("");
            return;
        }

        const fetchSubCategories = async () => {
            setLoadingSubCategories(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${selectedCategory}`);
                setSubCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching sub categories:", error);
                setSubCategories([]);
            } finally {
                setLoadingSubCategories(false);
            }
        };

        fetchSubCategories();
    }, [selectedCategory]);

    useEffect(() => {
        if (!selectedCategory || !selectedSubCategory) {
            setItemCategories([]);
            setSelectedItemCategory("");
            return;
        }

        const fetchItemCategories = async () => {
            setLoadingItemCategories(true);
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/item_category/by-category-subcategory/${selectedCategory}/${selectedSubCategory}`
                );
                setItemCategories(res.data || []);
            } catch (error) {
                console.error("Error fetching item categories:", error);
                setItemCategories([]);
            } finally {
                setLoadingItemCategories(false);
            }
        };

        fetchItemCategories();
    }, [selectedCategory, selectedSubCategory]);

    useEffect(() => {
        if (!selectedSubCategory) {
            setSelectedSubCategoryLabel("");
            return;
        }

        const fromList = subCategories.find((sub) => String(sub.id) === String(selectedSubCategory));
        if (fromList?.name) {
            setSelectedSubCategoryLabel(fromList.name);
            return;
        }

        let cancelled = false;
        const fetchSubCategoryById = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/sub_categories/${selectedSubCategory}`);
                if (!cancelled) {
                    setSelectedSubCategoryLabel(res.data?.name || "-");
                }
            } catch {
                if (!cancelled) {
                    setSelectedSubCategoryLabel("-");
                }
            }
        };

        fetchSubCategoryById();
        return () => {
            cancelled = true;
        };
    }, [selectedSubCategory, subCategories]);

    const selectedItemCategoryName = useMemo(() => {
        const selected = itemCategories.find((item) => String(item.id) === String(selectedItemCategory));
        return selected?.name || "";
    }, [itemCategories, selectedItemCategory]);

    const selectedCategoryName = useMemo(() => {
        const selected = categories.find((cat) => String(cat.id) === String(selectedCategory));
        return selected?.name || "";
    }, [categories, selectedCategory]);

    const selectedSubCategoryName = useMemo(() => selectedSubCategoryLabel || "", [selectedSubCategoryLabel]);

    const activeFields = useMemo(
        () =>
            fields
                .filter((field) => field.isActive)
                .slice()
                .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)),
        [fields]
    );

    const filteredFields = useMemo(() => {
        return fields
            .filter((field) => (hideInactiveFields ? field.isActive : true))
            .filter((field) => (filterInputType === "all" ? true : field.inputType === filterInputType))
            .slice()
            .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
    }, [fields, hideInactiveFields, filterInputType]);

    const canManageFields = Boolean(selectedCategory && selectedSubCategory && selectedItemCategory);
    const isUuidMode = Boolean(prefilledUuid);

    const loadFields = async (itemCategoryId) => {
        if (!itemCategoryId) {
            setFields([]);
            return;
        }

        setLoadingFields(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/item_category_fields/by-item-category/${itemCategoryId}`);
            setFields(res.data || []);
        } catch (error) {
            console.error("Error loading fields:", error);
            setFields([]);
        } finally {
            setLoadingFields(false);
        }
    };

    useEffect(() => {
        if (!selectedItemCategory) {
            setFields([]);
            return;
        }
        loadFields(selectedItemCategory);
    }, [selectedItemCategory]);

    const resetFieldForm = (override = {}) => {
        setFieldForm({
            label: "",
            key: "",
            inputType: "text",
            required: false,
            placeholder: "",
            defaultValue: "",
            helpText: "",
            displayOrder: fields.length + 1,
            isActive: true,
            options: [],
            ...override,
        });
        setFieldErrors({});
        setFieldKeyTouched(false);
    };

    const openCreateFieldModal = () => {
        setEditingFieldId(null);
        resetFieldForm();
        setShowFieldModal(true);
    };

    const openEditFieldModal = (field) => {
        if (!field) return;
        setEditingFieldId(field.id);
        resetFieldForm({
            ...field,
            options: Array.isArray(field.options) ? field.options : [],
        });
        setFieldKeyTouched(true);
        setShowFieldModal(true);
    };

    const closeFieldModal = () => {
        setShowFieldModal(false);
        setEditingFieldId(null);
        setFieldErrors({});
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
    };

    const openDeleteModal = (field) => {
        setFieldToDelete(field || null);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setFieldToDelete(null);
        setShowDeleteModal(false);
    };

    const addOptionRow = () => {
        setFieldForm((prev) => ({
            ...prev,
            options: [
                ...(prev.options || []),
                {
                    label: "",
                    value: "",
                    sortOrder: (prev.options?.length || 0) + 1,
                },
            ],
        }));
    };

    const updateOptionRow = (index, key, value) => {
        setFieldForm((prev) => ({
            ...prev,
            options: (prev.options || []).map((opt, idx) =>
                idx === index
                    ? {
                        ...opt,
                        [key]: value,
                    }
                    : opt
            ),
        }));
    };

    const removeOptionRow = (index) => {
        setFieldForm((prev) => ({
            ...prev,
            options: (prev.options || [])
                .filter((_, idx) => idx !== index)
                .map((opt, idx) => ({ ...opt, sortOrder: idx + 1 })),
        }));
    };

    const handleFieldInputChange = (event) => {
        const { name, type, value, checked } = event.target;
        const nextValue = type === "checkbox" ? checked : value;

        if (name === "label") {
            setFieldForm((prev) => ({
                ...prev,
                label: nextValue,
                key: fieldKeyTouched ? prev.key : slugifyKey(nextValue),
            }));
            setFieldErrors((prev) => ({ ...prev, label: undefined, api: undefined }));
            return;
        }

        if (name === "key") {
            setFieldKeyTouched(true);
            setFieldForm((prev) => ({ ...prev, key: slugifyKey(nextValue) }));
            setFieldErrors((prev) => ({ ...prev, key: undefined, api: undefined }));
            return;
        }

        if (name === "inputType") {
            const isOptionType = OPTION_BASED_TYPES.includes(nextValue);
            setFieldForm((prev) => ({
                ...prev,
                inputType: nextValue,
                options: isOptionType ? prev.options : [],
            }));
            setFieldErrors((prev) => ({ ...prev, inputType: undefined, options: undefined, api: undefined }));
            return;
        }

        setFieldForm((prev) => ({ ...prev, [name]: nextValue }));
        if (name === "placeholder" || name === "defaultValue" || name === "helpText" || name === "displayOrder") {
            setFieldErrors((prev) => ({ ...prev, api: undefined }));
        }
    };

    const validateFieldForm = () => {
        const errors = {};
        if (!fieldForm.label.trim()) errors.label = "Field label is required";
        if (!fieldForm.key.trim()) errors.key = "Field key is required";
        if (!fieldForm.inputType) errors.inputType = "Input type is required";

        if (OPTION_BASED_TYPES.includes(fieldForm.inputType)) {
            if (!fieldForm.options?.length) {
                errors.options = "At least one option is required for this input type";
            } else {
                const hasInvalidOption = fieldForm.options.some(
                    (opt) => !opt.label?.toString().trim() || !opt.value?.toString().trim()
                );
                if (hasInvalidOption) {
                    errors.options = "Each option must have label and value";
                }
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const saveField = async () => {
        if (!validateFieldForm()) return;
        if (!selectedItemCategory) return;

        const payload = {
            ...fieldForm,
            item_category_id: Number(selectedItemCategory),
            displayOrder: Number(fieldForm.displayOrder) || fields.length + 1,
            options: OPTION_BASED_TYPES.includes(fieldForm.inputType)
                ? (fieldForm.options || []).map((opt) => ({
                    ...opt,
                    label: capitalizeFirst(opt.label),
                }))
                : [],
        };

        try {
            setSavingField(true);
            if (editingFieldId) {
                await axios.put(`${API_BASE_URL}/item_category_fields/${editingFieldId}`, payload);
            } else {
                await axios.post(`${API_BASE_URL}/item_category_fields`, payload);
            }

            await loadFields(selectedItemCategory);
            closeFieldModal();
        } catch (error) {
            console.error("Error saving field:", error);
            setFieldErrors((prev) => ({
                ...prev,
                api:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Failed to save field",
            }));
        } finally {
            setSavingField(false);
        }
    };

    const deleteField = async (field) => {
        if (!field?.id) return;
        try {
            await axios.delete(`${API_BASE_URL}/item_category_fields/${field.id}`);
            await loadFields(selectedItemCategory);
        } catch (error) {
            console.error("Error deleting field:", error);
        } finally {
            closeDeleteModal();
        }
    };

    const toggleFieldStatus = async (field) => {
        if (!field?.id) return;
        try {
            await axios.patch(`${API_BASE_URL}/item_category_fields/${field.id}/status`);
            await loadFields(selectedItemCategory);
        } catch (error) {
            console.error("Error toggling field status:", error);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <Breadcrumb
                    mainhead="Item Category Form Builder"
                    page="Category Builder"
                    title="Item Category Form Builder"
                    actions={
                        <button
                            type="button"
                            className="btn btn-outline-secondary mb-2"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                    }
                />

                <div className="card mb-3">
                    <div className="card-body">

                        {isUuidMode ? (
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="border rounded-3 p-3 bg-light h-100">
                                        <div className="text-muted small text-uppercase fw-semibold mb-1">Category</div>
                                        <div className="fw-semibold fs-6">{selectedCategoryName || "-"}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="border rounded-3 p-3 bg-light h-100">
                                        <div className="text-muted small text-uppercase fw-semibold mb-1">Sub Category</div>
                                        <div className="fw-semibold fs-6">{selectedSubCategoryName || "-"}</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="border rounded-3 p-3 bg-light h-100">
                                        <div className="text-muted small text-uppercase fw-semibold mb-1">Item Category</div>
                                        <div className="fw-semibold fs-6">{selectedItemCategoryName || "-"}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                        }}
                                        disabled={loadingCategories}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Sub Category</label>
                                    <select
                                        className="form-select"
                                        value={selectedSubCategory}
                                        onChange={(e) => {
                                            setSelectedSubCategory(e.target.value);
                                        }}
                                        disabled={!selectedCategory || loadingSubCategories}
                                    >
                                        <option value="">Select Sub Category</option>
                                        {subCategories.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Item Category</label>
                                    <select
                                        className="form-select"
                                        value={selectedItemCategory}
                                        onChange={(e) => {
                                            setSelectedItemCategory(e.target.value);
                                        }}
                                        disabled={!selectedSubCategory || loadingItemCategories}
                                    >
                                        <option value="">Select Item Category</option>
                                        {itemCategories.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {canManageFields && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
                                <div>
                                    <h5 className="mb-1">Fields Manager</h5>
                                    <p className="mb-0 text-muted text-nowrap small">
                                        Item Category: <strong>{selectedItemCategoryName || "-"}</strong>
                                    </p>
                                </div>
                                <div className="d-flex flex-column justify-content-end flex-sm-row gap-2 w-100 w-lg-auto">
                                    <select
                                        className="form-select"
                                        value={filterInputType}
                                        onChange={(e) => setFilterInputType(e.target.value)}
                                        style={{ minWidth: 170 }}
                                    >
                                        <option value="all">All Input Types</option>
                                        {INPUT_TYPES.map((type) => (
                                            <option key={`filter-${type}`} value={type}>
                                                {prettifyInputType(type)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-check d-flex align-items-center ms-sm-2">
                                        <input
                                            className="form-check-input me-2"
                                            type="checkbox"
                                            id="hideInactiveFields"
                                            checked={hideInactiveFields}
                                            onChange={(e) => setHideInactiveFields(e.target.checked)}
                                        />
                                        <label className="form-check-label text-nowrap" htmlFor="hideInactiveFields">
                                            Hide Inactive
                                        </label>
                                    </div>
                                    <button
                                        className="btn btn-outline-dark"
                                        onClick={() => setShowPreviewModal(true)}
                                        disabled={activeFields.length === 0}
                                    >
                                        Preview
                                    </button>
                                    <button className="btn btn-primary" onClick={openCreateFieldModal}>
                                        Add Field
                                    </button>
                                </div>
                            </div>

                            {loadingFields ? (
                                <div className="table-responsive border rounded-3">
                                    <table className="table align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Order</th>
                                                <th>Label</th>
                                                <th>Key</th>
                                                <th>Type</th>
                                                <th>Required</th>
                                                <th>Status</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3].map((row) => (
                                                <tr key={`skeleton-${row}`}>
                                                    <td colSpan="7">
                                                        <div className="placeholder-glow d-flex gap-2">
                                                            <span className="placeholder col-1"></span>
                                                            <span className="placeholder col-3"></span>
                                                            <span className="placeholder col-2"></span>
                                                            <span className="placeholder col-2"></span>
                                                            <span className="placeholder col-1"></span>
                                                            <span className="placeholder col-1"></span>
                                                            <span className="placeholder col-2"></span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : fields.length === 0 ? (
                                <div className="border rounded-3 p-4 bg-light-subtle">
                                    <h6 className="mb-1">No fields added yet</h6>
                                    <p className="text-muted mb-3">Start building your dynamic form by creating the first field.</p>
                                    <button className="btn btn-primary btn-sm" onClick={openCreateFieldModal}>
                                        Add First Field
                                    </button>
                                </div>
                            ) : filteredFields.length === 0 ? (
                                <div className="alert alert-warning mb-0">
                                    No fields match the selected filters.
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive border rounded-3">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Order</th>
                                                    <th>Label</th>
                                                    <th>Key</th>
                                                    <th>Type</th>
                                                    <th>Required</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFields.map((field, idx) => (
                                                    <tr key={`${field.id || field.key}-${idx}`}>
                                                        <td>
                                                            <span className="badge rounded-pill text-bg-light border">
                                                                {field.displayOrder}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="fw-semibold">{field.label}</div>
                                                            {field.helpText ? (
                                                                <small className="text-muted d-block text-truncate" style={{ maxWidth: 220 }}>
                                                                    {field.helpText}
                                                                </small>
                                                            ) : null}
                                                        </td>
                                                        <td>
                                                            <span className="badge rounded-pill bg-light text-dark border">{field.key}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${TYPE_BADGE_CLASS[field.inputType] || "bg-light text-dark border"}`}>
                                                                {prettifyInputType(field.inputType)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${field.required ? "bg-danger-subtle text-danger border" : "bg-secondary-subtle text-secondary border"}`}>
                                                                {field.required ? "Required" : "Optional"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className={`badge ${field.isActive ? "bg-success" : "bg-secondary"}`}>
                                                                    {field.isActive ? "Active" : "Inactive"}
                                                                </span>
                                                                <div className="form-check form-switch m-0">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        checked={Boolean(field.isActive)}
                                                                        onChange={() => toggleFieldStatus(field)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-end">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => openEditFieldModal(field)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => openDeleteModal(field)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {showFieldModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editingFieldId ? "Edit Field" : "Add Field"}</h5>
                                    <button type="button" className="btn-close" onClick={closeFieldModal}></button>
                                </div>
                                <div className="modal-body">
                                    {fieldErrors.api ? (
                                        <div className="alert alert-danger py-2">{fieldErrors.api}</div>
                                    ) : null}
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Field Label</label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.label ? "is-invalid" : ""}`}
                                                name="label"
                                                value={fieldForm.label}
                                                onChange={handleFieldInputChange}
                                                placeholder="Ex: Voltage"
                                            />
                                            {fieldErrors.label ? <div className="invalid-feedback">{fieldErrors.label}</div> : null}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Field Key</label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.key ? "is-invalid" : ""}`}
                                                name="key"
                                                value={fieldForm.key}
                                                onChange={handleFieldInputChange}
                                                placeholder="Ex: voltage"
                                            />
                                            {fieldErrors.key ? <div className="invalid-feedback">{fieldErrors.key}</div> : null}
                                            {!fieldErrors.key ? (
                                                <div className="form-text">Key auto-generates from label. You can customize it.</div>
                                            ) : null}
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Input Type</label>
                                            <select
                                                className={`form-select ${fieldErrors.inputType ? "is-invalid" : ""}`}
                                                name="inputType"
                                                value={fieldForm.inputType}
                                                onChange={handleFieldInputChange}
                                            >
                                                {INPUT_TYPES.map((type) => (
                                                    <option key={type} value={type}>
                                                        {prettifyInputType(type)}
                                                    </option>
                                                ))}
                                            </select>
                                            {fieldErrors.inputType ? <div className="invalid-feedback">{fieldErrors.inputType}</div> : null}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Display Order</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-control"
                                                name="displayOrder"
                                                value={fieldForm.displayOrder}
                                                onChange={handleFieldInputChange}
                                            />
                                        </div>
                                        <div className="col-md-4 d-flex align-items-end gap-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="requiredCheck"
                                                    name="required"
                                                    checked={fieldForm.required}
                                                    onChange={handleFieldInputChange}
                                                />
                                                <label className="form-check-label" htmlFor="requiredCheck">Required</label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="activeCheck"
                                                    name="isActive"
                                                    checked={fieldForm.isActive}
                                                    onChange={handleFieldInputChange}
                                                />
                                                <label className="form-check-label" htmlFor="activeCheck">Active</label>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Placeholder</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="placeholder"
                                                value={fieldForm.placeholder}
                                                onChange={handleFieldInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Default Value</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="defaultValue"
                                                value={fieldForm.defaultValue}
                                                onChange={handleFieldInputChange}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Help Text</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                name="helpText"
                                                value={fieldForm.helpText}
                                                onChange={handleFieldInputChange}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {OPTION_BASED_TYPES.includes(fieldForm.inputType) && (
                                        <div className="mt-4 border rounded-3 p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0">Options</h6>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOptionRow}>
                                                    Add Option
                                                </button>
                                            </div>
                                            {fieldErrors.options ? <div className="text-danger small mb-2">{fieldErrors.options}</div> : null}

                                            {(fieldForm.options || []).map((opt, idx) => (
                                                <div className="row g-2 mb-2" key={`option-${idx}`}>
                                                    <div className="col-md-4">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Label"
                                                            value={opt.label}
                                                            onChange={(e) => updateOptionRow(idx, "label", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Value"
                                                            value={opt.value}
                                                            onChange={(e) => updateOptionRow(idx, "value", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="form-control"
                                                            placeholder="Sort"
                                                            value={opt.sortOrder}
                                                            onChange={(e) => updateOptionRow(idx, "sortOrder", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-1 d-grid">
                                                        <button type="button" className="btn btn-outline-danger" onClick={() => removeOptionRow(idx)}>
                                                            x
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeFieldModal} disabled={savingField}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={saveField} disabled={savingField}>
                                        {savingField ? "Saving..." : editingFieldId ? "Update Field" : "Save Field"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showPreviewModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                        <div className="modal-dialog modal-xl modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div className="flex-grow-1 pe-3">
                                        <h5 className="modal-title mb-1">Form Preview</h5>
                                        <p className="text-muted small mb-0 mt-1">
                                            {selectedCategoryName || "-"} / {selectedSubCategoryName || "-"} / {selectedItemCategoryName || "-"}
                                        </p>
                                    </div>
                                    <button type="button" className="btn-close" onClick={closePreviewModal}></button>
                                </div>
                                <div className="modal-body">
                                    {activeFields.length === 0 ? (
                                        <div className="alert alert-light border mb-0">
                                            No Active Fields
                                        </div>
                                    ) : (
                                        <form className="row g-3">
                                            {activeFields.map((field, idx) => (
                                                <div className="col-md-6" key={`preview-${field.key}-${idx}`}>
                                                    <label className="form-label">
                                                        {field.label} {field.required ? <span className="text-danger">*</span> : null}
                                                    </label>

                                                    {field.inputType === "textarea" ? (
                                                        <textarea className="form-control" placeholder={field.placeholder || ""} defaultValue={field.defaultValue || ""} rows="3" readOnly />
                                                    ) : field.inputType === "radio" ? (
                                                        <div>
                                                            {(field.options || [])
                                                                .slice()
                                                                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                                                                .map((opt, optIdx) => (
                                                                    <div className="form-check" key={`${field.key}-radio-${optIdx}`}>
                                                                        <input className="form-check-input" type="radio" disabled />
                                                                        <label className="form-check-label">{capitalizeFirst(opt.label)}</label>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    ) : field.inputType === "checkbox" ? (
                                                        <div>
                                                            {(field.options || [])
                                                                .slice()
                                                                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                                                                .map((opt, optIdx) => (
                                                                    <div className="form-check" key={`${field.key}-chk-${optIdx}`}>
                                                                        <input className="form-check-input" type="checkbox" disabled />
                                                                        <label className="form-check-label">{capitalizeFirst(opt.label)}</label>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    ) : OPTION_BASED_TYPES.includes(field.inputType) ? (
                                                        <select
                                                            className="form-select"
                                                            defaultValue={field.inputType === "multiselect" ? [] : ""}
                                                            multiple={field.inputType === "multiselect"}
                                                        >
                                                            <option value="">Select {field.label}</option>
                                                            {(field.options || [])
                                                                .slice()
                                                                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                                                                .map((opt, optIdx) => (
                                                                    <option key={`${field.key}-${optIdx}`} value={opt.value}>
                                                                        {capitalizeFirst(opt.label)}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            className="form-control"
                                                            type={field.inputType === "decimal" ? "number" : field.inputType}
                                                            placeholder={field.placeholder || ""}
                                                            defaultValue={field.defaultValue || ""}
                                                            readOnly
                                                        />
                                                    )}

                                                    {field.helpText ? <small className="text-muted d-block mt-1">{field.helpText}</small> : null}
                                                </div>
                                            ))}
                                        </form>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closePreviewModal}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Delete Field</h5>
                                    <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                                </div>
                                <div className="modal-body">
                                    Are you sure you want to delete field <strong>{fieldToDelete?.label || ""}</strong>?
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                                    <button type="button" className="btn btn-danger" onClick={() => deleteField(fieldToDelete)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemCategoryFormBuilder;