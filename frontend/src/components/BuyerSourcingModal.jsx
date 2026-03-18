import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import UseAuth from "../sections/UseAuth";

const BuyerSourcingModal = () => {
  const { user } = UseAuth();
  const { showNotification } = useAlert();
  const [itemCategoryData, setItemcategoryData] = useState({ categories: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem("user_token");
    axios
      .get(`${API_BASE_URL}/dashboard/get-itemtype?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setItemcategoryData(res.data || { categories: [] });
      });
  }, [user]);

  const handleCategoryChange = async (categoryId) => {
    const token = localStorage.getItem("user_token");
    setSelectedCategoryId(categoryId);
    setSelectedSubIds([]);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/dashboard/get-item-subcategory?categoryId=${categoryId}&userId=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubCategories(res.data?.subcategories || []);
      const checkedIds = res.data.subcategories
        .filter((s) => s.checked)
        .map((s) => s.id);
      setSelectedSubIds(checkedIds);
      setCategoryCounts(prev => ({
        ...prev,
        [categoryId]: checkedIds.length
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAll = async (e) => {
    if (!selectedCategoryId) return;
    const token = localStorage.getItem("user_token");
    let updatedSubIds = [];
    if (e.target.checked) {
      updatedSubIds = subCategories.map((sub) => sub.id);
    }
    setSelectedSubIds(updatedSubIds);
    setCategoryCounts((prev) => ({
      ...prev,
      [selectedCategoryId]: updatedSubIds.length,
    }));

    try {
      await axios.post(
        `${API_BASE_URL}/dashboard/store-item-subcategory`,
        {
          userId: user.id,
          activity: {
            category_id: selectedCategoryId,
            subcategory_ids: subCategories.map((sub) => sub.id),
            action: e.target.checked ? "add" : "remove",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      showNotification("Failed to save all selections", "error");
    }
  };

  const handleSubCheck = async (id) => {
  const token = localStorage.getItem("user_token");
  const isChecked = selectedSubIds.includes(id);
  let updatedIds = isChecked
    ? selectedSubIds.filter(x => x !== id)
    : [...selectedSubIds, id];
  setSelectedSubIds(updatedIds);

  // Update categoryCounts for current category based on updatedIds count
  setCategoryCounts(prev => ({
    ...prev,
    [selectedCategoryId]: updatedIds.length
  }));

  try {
    const res = await axios.post(
      `${API_BASE_URL}/dashboard/store-item-subcategory`,
      {
        userId: user.id,
        activity: {
          category_id: selectedCategoryId,
          subcategory_ids: [id],
          action: isChecked ? "remove" : "add"
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (res.data.success) {
      showNotification(res.data.message, "success");
    }
  } catch (err) {
    showNotification("Failed to save interest", "error");
  }
};

  const term = categorySearch.trim().toLowerCase();
  const filteredCategories = (itemCategoryData?.categories || []).map((category) => {
    const categoryMatch = category.name?.toLowerCase().includes(term);
    // ⭐ If category matches → return FULL category with all children
    if (categoryMatch) {
      return {
        ...category,
        groups: category.groups?.map(group => ({
          ...group,
          categories: group.categories
        }))
      };
    }
    const matchedGroups = category.groups
      ?.map((group) => {
        const groupMatch = group.name?.toLowerCase().includes(term);
        const matchedItems = group.categories?.filter((item) =>
          item.name?.toLowerCase().includes(term)
        );
        // ⭐ If subcategory matches → return full group
        if (groupMatch) {
          return {
            ...group,
            categories: group.categories
          };
        }
        // ⭐ If item matches → return group with only those items
        if (matchedItems.length > 0) {
          return {
            ...group,
            categories: matchedItems
          };
        }
        return null;
      })
      .filter(Boolean);
    if (matchedGroups.length > 0) {
      return {
        ...category,
        groups: matchedGroups
      };
    }
    return null;
  })
  .filter(Boolean);

  const finalCategories = filteredCategories
  .map(category => {
    let groups = category.groups?.map(group => {
      let items = group.categories;

      if (categoryFilter === "hasCount") {
        items = items?.filter(item => {
          const count = categoryCounts?.[item.id] ?? item.count ?? 0;
          return count > 0;
        });
      }
      if (!items || items.length === 0) return null;

      return {
        ...group,
        categories: items
      };
    }).filter(Boolean);

    if (!groups || groups.length === 0) return null;

    return {
      ...category,
      groups
    };
  }).filter(Boolean);

  return (
    <div className="modal fade" id="buyerSourcing">
      <div className="modal-dialog modal-lg" style={{ maxWidth: "1200px" }}>
        <div className="modal-content p-2">
          <div className="modal-header">
            <h4 className="modal-title">Sourcing Interest</h4>
            <button className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            <div className="row">
              {/* LEFT CATEGORY PART */}
              <div className="col-9 border-end">
                <div className="d-flex justify-content-between align-items-center mb-3">
  <h6 className="mb-0">Category</h6>
  <select
    className="form-select form-select-sm w-auto"
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    <option value="all">Show All</option>
    <option value="hasCount">Show Categories With Count</option>
  </select>
</div>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                <div className="heightPart row g-3">
                  {finalCategories.map(category => (
                    <div key={category.id} className="col-12">
                      {/* CATEGORY CARD */}
                      <div className="card shadow-sm border mb-3">
                        {/* Category Header */}
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">{category.name}</h5>
                        </div>
                        <div className="card-body">
                          {category.groups?.map(group => (
                            <div key={group.id} className="card mb-3 border">
                              {/* SUBCATEGORY / GROUP HEADER */}
                              <div className="card-header bg-light">
                                <h6 className="mb-0">{group.name}</h6>
                              </div>
                              {/* ITEM CATEGORY LIST */}
                              <div className="card-body">
                                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                                  {group.categories
                                    .filter(cat => {
                                      const term = categorySearch.toLowerCase();
                                      return (
                                        cat.name?.toLowerCase().includes(term) ||
                                        group.name?.toLowerCase().includes(term) ||
                                        category.name?.toLowerCase().includes(term)
                                      );
                                    })
                                    .map(cat => (
                                      <div className="col" key={cat.id}>
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectedCategoryId === cat.id}
                                            onChange={() => handleCategoryChange(cat.id)}
                                            id={`category_${cat.id}`}
                                          />
                                          <label
                                            className="form-check-label"
                                            htmlFor={`category_${cat.id}`}
                                          >
                                            {cat.name}
                                            {(categoryCounts?.[cat.id] ?? cat.count) > 0 && (
                                              <span className="badge bg-success ms-2">
                                                {categoryCounts?.[cat.id] ?? cat.count}
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* RIGHT SUBCATEGORY PART */}
              <div className="col-3" style={{ background: "#ffe5e5" }}>
                <div className="p-2 rightPart">
                  <h6 className="mb-3 mt-2">Please Select The Type</h6>
                  {subCategories.length === 0 && (
                    <p className="text-muted">
                      Please select a type to see categories
                    </p>
                  )}
                  {selectedCategoryId && subCategories.length > 0 && (
                    <>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Search sub-category..."
                        value={subCategorySearch}
                        onChange={(e) => setSubCategorySearch(e.target.value)}
                      />
                      <div className="subpart">
                        <div className="mb-3 bg-primary p-2 rounded text-white">
                          <label htmlFor="checkAllsub" className="d-flex">
                            <input
                              type="checkbox"
                              className="me-2"
                              id="checkAllsub"
                              checked={
                                selectedSubIds.length === subCategories.length &&
                                subCategories.length > 0
                              }
                              onChange={handleCheckAll}
                            />
                            Check All
                          </label>
                        </div>
                        {subCategories
                          .filter(sub =>
                            sub.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                          )
                          .map(sub => (
                            <div key={sub.id} className="subcate mb-3">
                              <div className="border p-2 rounded bg-white">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="me-2"
                                    checked={selectedSubIds.includes(sub.id)}
                                    onChange={() => handleSubCheck(sub.id)}
                                  />
                                  {sub.name}
                                </label>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerSourcingModal;