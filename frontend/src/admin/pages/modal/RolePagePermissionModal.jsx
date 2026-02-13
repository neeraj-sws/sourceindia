import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const sidebarPermissions = [
  { key: "dashboard", label: "Dashboard", subKeys: [] },
  { 
    key: "buyers", 
    label: "Buyers", 
    subKeys: [
      "add_buyer",
      "buyers_list",
      "inactive_buyers",
      "not_approved_buyers",
      "removed_buyers",
      "buyer_enquiries"
    ] 
  },
  { 
    key: "sellers", 
    label: "Sellers", 
    subKeys: [
      "add_seller",
      "sellers_list",
      "inactive_sellers",
      "not_completed_sellers",
      "not_approved_sellers",
      "removed_sellers"
    ] 
  },
  { key: "public_enquiries", label: "Public Enquiries", subKeys: [] },
  { 
    key: "leads", 
    label: "Leads Master", 
    subKeys: [
      "approve_leads",
      "enquiries_list"
    ] 
  },
  { 
    key: "open_enquiries", 
    label: "Open Enquiries", 
    subKeys: [
      "open_enquiry_list",
      "delete_open_enquiry"
    ] 
  },
  { 
    key: "management_portal", 
    label: "Management Portal", 
    subKeys: [
      "roles",
      "sub_admin"
    ] 
  },
  { 
    key: "categories_total", 
    label: "Category Master", 
    subKeys: [
      "categories",
      "sub_categories",
      "interest_categories",
      "source_interest_categories",
      "item_category",
      "item_sub_category",
      "new_items"
    ] 
  },
  { 
    key: "total_product", 
    label: "Products", 
    subKeys: [
      "add_product",
      "approve_product",
      "notapprove_product"
    ] 
  },
  { 
    key: "tickets_list", 
    label: "Support System", 
    subKeys: [
      "tickets",
      "ticket_categories"
    ] 
  },
  { 
    key: "faqs_list", 
    label: "FAQ", 
    subKeys: [
      "faqs",
      "faq_categories"
    ] 
  },
  { key: "home_banners", label: "Home Banner", subKeys: [] },
  { key: "knowledge_center", label: "Knowledge Center", subKeys: [] },
  { key: "emails", label: "Emails Templates", subKeys: [] },
  { key: "membership_plan", label: "Membership Plan", subKeys: [] },
  { key: "contacts", label: "Contact Us", subKeys: [] },
  { 
    key: "newsletters_list", 
    label: "Email Circular", 
    subKeys: [
      "newsletters",
      "add_email_circular"
    ] 
  },
  { 
    key: "registrations_all", 
    label: "Event 2024 Registrations", 
    subKeys: [
      "registrations",
      "registrations_deleted"
    ] 
  },
  { 
    key: "activities_section", 
    label: "Activity", 
    subKeys: [
      "core_activities",
      "activities"
    ] 
  },
  { key: "applications", label: "Applications", subKeys: [] },
  { key: "testimonials", label: "Testimonials", subKeys: [] },
  { 
    key: "all_settings", 
    label: "Settings", 
    subKeys: [
      "site_settings",
      "home_settings",
      "shortcut_page",
      "front_menu"
    ] 
  },
  { key: "seo_pages", label: "Seo Pages", subKeys: [] },
  { key: "user_history", label: "User History", subKeys: [] },
  { key: "user_activity", label: "User Activities", subKeys: [] },
  { 
    key: "pages_section", 
    label: "Pages", 
    subKeys: [
      "terms_conditions",
      "privacy_policy"
    ] 
  },
  { 
    key: "reports_section", 
    label: "Reports", 
    subKeys: [
      "seller_category_report",
      "product_category_report",
      "seller_category_graph",
      "product_category_graph",
      "sourcing_interest_graph"
    ] 
  }
];

const RolePagePermissionModal = ({ show, onClose, role, onPagesUpdated }) => {
  const { showNotification } = useAlert();
  const [selectedPages, setSelectedPages] = useState([]);

  useEffect(() => {
    if (role?.pages) {
      try {
        const pages = Array.isArray(role.pages) ? role.pages : JSON.parse(role.pages);
        setSelectedPages(pages);
      } catch {
        setSelectedPages([]);
      }
    } else {
      setSelectedPages([]);
    }
  }, [role]);

  // Toggle parent (all submenus)
  const toggleParent = (parentKey, checked) => {
    let newPages = [...selectedPages];
    const menu = sidebarPermissions.find(m => m.key === parentKey);

    if (checked) {
      // Add parent with all subPages
      newPages = newPages.filter(p => p.key !== parentKey);
      newPages.push({ key: parentKey, subPages: [...menu.subKeys] });
    } else {
      // Remove parent entirely
      newPages = newPages.filter(p => p.key !== parentKey);
    }

    setSelectedPages(newPages);
  };

  // Toggle sub-menu
  const toggleSubMenu = (parentKey, subKey) => {
    let newPages = [...selectedPages];
    const existing = newPages.find(p => p.key === parentKey);

    if (existing) {
      if (existing.subPages.includes(subKey)) {
        existing.subPages = existing.subPages.filter(s => s !== subKey);
      } else {
        existing.subPages.push(subKey);
      }
      // remove parent if no subPages left
      if (existing.subPages.length === 0) {
        newPages = newPages.filter(p => p.key !== parentKey);
      }
    } else {
      newPages.push({ key: parentKey, subPages: [subKey] });
    }

    setSelectedPages(newPages);
  };

  // Check if parent is fully selected
  const isParentChecked = (menu) => {
  const parent = selectedPages.find(p => p.key === menu.key);
  return !!(parent && parent.subPages.length === menu.subKeys.length);
};

// Check if sub-menu is selected
const isSubChecked = (menuKey, subKey) => {
  const parent = selectedPages.find(p => p.key === menuKey);
  return !!(parent && parent.subPages.includes(subKey));
};

  const handleSave = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/roles/${role.id}/pages`, {
        pages: selectedPages,
      });
      onPagesUpdated(role.id, selectedPages);
      showNotification("Page permissions updated!", "success");
      onClose();
    } catch (error) {
      showNotification("Failed to update pages", "error");
    }
  };

  if (!show) return null;

  return (
    <>
    <div className="modal show d-block">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Manage Sidebar Pages</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
  <div className="row">
    {(() => {
      // Split the permissions into 3 roughly equal columns
      const columns = [[], [], []];
      sidebarPermissions.forEach((menu, index) => {
        columns[index % 3].push(menu);
      });
      return columns.map((col, colIndex) => (
        <div className="col-md-4" key={colIndex}>
          {col.map((menu) => {
            const parentChecked = isParentChecked(menu);
            return (
              <div key={menu.key} className="mb-3 border-bottom pb-2">
                <div className="d-flex align-items-center mb-1">
                  <input
                    type="checkbox"
                    id={`parent_${menu.key}`}
                    className="form-check-input me-2"
                    checked={parentChecked}
                    onChange={(e) => toggleParent(menu.key, e.target.checked)}
                  />
                  <label
                    className="mb-0 fw-semibold fs-6 flex-grow-1"
                    htmlFor={`parent_${menu.key}`}
                  >
                    {menu.label}
                  </label>
                </div>
                <div className="ps-4">
                  {menu.subKeys.map((sub) => (
                    <div className="form-check mb-1" key={sub}>
                      <input
                        type="checkbox"
                        id={`sub_${menu.key}_${sub}`}
                        className="form-check-input"
                        checked={isSubChecked(menu.key, sub)}
                        onChange={() => toggleSubMenu(menu.key, sub)}
                      />
                      <label
                        className="form-check-label fs-7"
                        htmlFor={`sub_${menu.key}_${sub}`}
                      >
                        {sub.replace(/_/g, " ").toLowerCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ));
    })()}
  </div>
</div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default RolePagePermissionModal;
