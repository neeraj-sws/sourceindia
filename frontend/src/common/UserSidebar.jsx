import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UseAuth from "../sections/UseAuth";

const SidebarItem = ({ item, currentPath, isOpen, onClick }) => {
  const hasSubMenu = item.subMenu && item.subMenu.length > 0;
  const isSubMenuActive =
    hasSubMenu && item.subMenu.some((sub) => sub.link === currentPath);

  const itemLinks = Array.isArray(item.link) ? item.link : [item.link];
  const isItemActive = itemLinks.includes(currentPath) || isSubMenuActive;
  const shouldExpand = isOpen || isSubMenuActive;

  return (
    <li className={isItemActive ? "mm-active" : ""}>
      <Link
        to={
          hasSubMenu
            ? "#"
            : Array.isArray(item.link)
              ? item.link[0]
              : item.link || "#"
        }
        className={hasSubMenu ? "has-arrow" : ""}
        aria-expanded={shouldExpand}
        onClick={(e) => {
          if (hasSubMenu) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="parent-icon">
          <i className={item.icon}></i>
        </div>
        <div className="menu-title">{item.title}</div>
      </Link>

      {hasSubMenu && (
        <ul className={`mm-collapse ${shouldExpand ? "mm-show" : ""}`}>
          {item.subMenu?.map((sub, idx) => (
            <li
              key={idx}
              className={sub.link === currentPath ? "mm-active" : ""}
            >
              <Link to={sub.link}>
                <i className="bx bx-right-arrow-alt" />
                {sub.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const UserSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openIndex, setOpenIndex] = useState(null);
  const { user } = UseAuth();

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  // ✅ Menu configuration
  const menuData = [
    // Always visible
    { title: "Dashboard", icon: "bx bx-home-circle", link: "/dashboard" },
    { title: "Profile", icon: "bx bx-user", link: "/profile" },

    // My Products (member_role == 1 or 3) && is_seller == 1 && is_company == 1
    {
      title: "My Products",
      icon: "bx bx-devices",
      link: "/my-product",
      show:
        (user?.member_role === 1 || user?.member_role === 3) &&
        user?.is_seller === 1 &&
        user?.is_company === 1,
    },

    // Leads (is_seller == 1 && is_complete == 1 && is_approve == 1)
    {
      title: "Leads",
      icon: "bx bx-user",
      link: "/seller_enquiry",
      show:
        user?.is_seller === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Lead Messages ((member_role == 1 || 3) && is_seller == 1 && complete == 1 && approve == 1)
    {
      title: "Lead Messages",
      icon: "bx bx-chat",
      link: "/lead-messages",
      show:
        (user?.member_role === 1 || user?.member_role === 3) &&
        user?.is_seller === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Enquiries (member_role == 1 && complete == 1 && approve == 1)
    {
      title: "Enquiries",
      icon: "bx bx-folder",
      link: "/my_enquiry",
      show:
        user?.member_role === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Enquiry Messages (member_role != 3 && complete == 1 && approve == 1)
    {
      title: "Enquiry Messages",
      icon: "bx bx-chat",
      link: "/enquiry-messages",
      show:
        user?.member_role !== 3 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Open Enquiries ((member_role == 1 or 3) && is_seller == 1 && complete == 1 && approve == 1)
    {
      title: "Open Enquiries",
      icon: "bx bx-folder-open",
      link: "/open-enquiries",
      show:
        (user?.member_role === 1 || user?.member_role === 3) &&
        user?.is_seller === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // My Open Enquiries ((approve == 1 && seller == 1) || seller == 0)
    {
      title: "My Open Enquiries",
      icon: "bx bx-list-ul",
      link: "/my-open-enquiries",
      show:
        (user?.is_approve === 1 && user?.is_seller === 1) ||
        user?.is_seller === 0,
    },

    // ✅ Always visible (common)
    { title: "Add Open Enquiries", icon: "bx bx-plus", link: "/add-open-enquiries" },
    { title: "My All Enquiries Chats", icon: "bx bx-message", link: "/my-all-enquiries-chats" },
  ];

  // ✅ Filtering logic
  const filteredMenu = menuData.filter(
    (item) => item.show === undefined || item.show === true
  );

  return (
    <div className="sidebar-wrapper" data-simplebar="init">
      <div className="simplebar-content" style={{ padding: 0 }}>
        <div className="sidebar-header">
          <div>
            <img src="/logo.png" className="logo-icon" alt="logo icon" />
          </div>
          <div className="toggle-icon ms-auto">
            <i className="bx bx-arrow-to-left" />
          </div>
        </div>

        <ul className="metismenu" id="menu">
          {filteredMenu.map((item, idx) => (
            <SidebarItem
              key={idx}
              item={item}
              currentPath={currentPath}
              isOpen={openIndex === idx}
              onClick={() => handleToggle(idx)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserSidebar;
