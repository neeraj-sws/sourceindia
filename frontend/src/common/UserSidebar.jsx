import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
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
          {item.subMenu
            ?.filter((sub) => sub.show === undefined || sub.show === true)
            .map((sub, idx) => (
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
  const [logoUrl, setLogoUrl] = useState('/logo.png'); // state to store logo URL

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings/site`);
        const data = response.data;
        if (data?.logo_file) {
          setLogoUrl(ROOT_URL + '/' + data.logo_file);
        } else {
          setLogoUrl("/logo.png");
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
        setLogoUrl("/logo.png");
      }
    };

    fetchSiteSettings();
  }, []);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  // ✅ Menu configuration
  const menuData = [
    // Always visible
    {
      icon: "bx bx-home-circle", link: "/dashboard", title: user?.is_seller === 1 ? "Seller Dashboard" : "Buyer Dashboard",
    },
    { title: "Profile", icon: "bx bx-user", link: "/profile" },

    // My Products (member_role == 1 or 3) && is_seller == 1 && is_company == 1
    {
      title: "Add Product/Service",
      icon: "bx bx-comment-add",
      link: "/add_product",
      show:
        (user?.member_role === 1 || user?.member_role === 3) &&
        user?.is_seller === 1 &&
        user?.is_company === 1,
    },

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
      title: "Lead Chats",
      icon: "bx bx-chat",
      link: "/all-leads-chats",
      show:
        (user?.member_role === 1 || user?.member_role === 3) &&
        user?.is_seller === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Enquiries (member_role == 1 && complete == 1 && approve == 1)
    {
      title: "My Enquiries",
      icon: "bx bx-folder",
      link: "/my_enquiry",
      show:
        user?.member_role === 1 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Enquiry Messages (member_role != 3 && complete == 1 && approve == 1)
    {
      title: "Enquiry Chats",
      icon: "bx bx-chat",
      link: "/my-all-enquiries-chats",
      show:
        user?.member_role !== 3 &&
        user?.is_complete === 1 &&
        user?.is_approve === 1,
    },

    // Open Enquiries ((member_role == 1 or 3) && is_seller == 1 && complete == 1 && approve == 1)
    {
      title: "Open Enquiries",
      icon: "bx bx-folder-open",
      link: "/open-enquiry-dashboard",
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
      link: "/my-open-enquiry-dashboard",
      show:
        (user?.is_approve === 1 && user?.is_seller === 1) ||
        user?.is_seller === 0,
    },

    // My Buyer Enquiries (complete == 1 && approve == 1)
    {
      title: user?.is_seller === 1 ? "Buyer Connects" : "Seller Connects",
      icon: "bx bx-message-square-dots",
      link: "/my-buyer-enquiries",
      show: user?.is_complete === 1 && user?.is_approve === 1,
    },

    // ✅ Always visible (common)
    { title: "Add Open Enquiries", icon: "bx bx-plus", link: "/enquiry" },
    // { title: "My All Enquiries Chats", icon: "bx bx-message", link: "/my-all-enquiries-chats" },

    {
      title: "Post Buy Requirement",
      icon: "bx bx-list-ul",
      show: true,
      subMenu: [
        { title: "Send", link: "/my-buy-requirements", show: true },
        { title: "Send History", link: "/my-requirement-history", show: true },
        {
          title: "Received",
          link: "/buy-leads",
          show: user?.is_seller === 1 && user?.is_complete === 1 && user?.is_approve === 1,
        },
        {
          title: "Received History",
          link: "/lead-history",
          show: user?.is_seller === 1 && user?.is_complete === 1 && user?.is_approve === 1,
        },
        {
          title: "My Performance",
          link: "/my-performance",
          show: user?.is_seller === 1 && user?.is_complete === 1 && user?.is_approve === 1,
        },
      ],
    },
  ];

  // ✅ Filtering logic
  const filteredMenu = menuData.filter(
    (item) => item.show === undefined || item.show === true
  );

  return (
    <div className="sidebar-wrapper" data-simplebar="init">
      <div className="simplebar-wrapper" style={{ margin: 0 }}>
        <div className="simplebar-height-auto-observer-wrapper">
          <div className="simplebar-height-auto-observer" />
        </div>
        <div className="simplebar-mask">
          <div className="simplebar-offset" style={{ right: 0, bottom: 0 }}>
            <div
              className="simplebar-content-wrapper"
              style={{ height: "100%", overflow: "hidden scroll" }}
            >
              <div className="simplebar-content mm-active" style={{ padding: 0 }}>
                <div className="sidebar-header">
                  <div>
                    <Link to="/">
                      <img src={logoUrl} className="logo-icon" alt="logo icon" loading="lazy"
                        decoding="async" onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/logo.png";
                        }} />
                    </Link>
                  </div>
                  <div className="toggle-icon ms-auto">
                    <i className="bx bx-arrow-to-left" />
                  </div>
                </div>
                {/*navigation*/}
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
                {/*end navigation*/}
              </div>
            </div>
          </div>
        </div>
        <div
          className="simplebar-placeholder"
          style={{ width: "auto", height: 1391 }}
        />
      </div>
      <div
        className="simplebar-track simplebar-horizontal"
        style={{ visibility: "hidden" }}
      >
        <div
          className="simplebar-scrollbar simplebar-visible"
          style={{ width: 0, display: "none" }}
        />
      </div>
      <div
        className="simplebar-track simplebar-vertical"
        style={{ visibility: "visible" }}
      >
        <div
          className="simplebar-scrollbar simplebar-visible"
          style={{
            height: 78,
            transform: "translate3d(0px, 0px, 0px)",
            display: "block"
          }}
        />
      </div>
    </div>
  );
};

export default UserSidebar;
