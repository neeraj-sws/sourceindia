import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuData = [
  {
    title: 'Dashboard',
    icon: 'bx bx-home-circle',
    link: ['/admin','/admin/dashboard'],
  },
  {
    title: 'Buyers',
    icon: 'bx bx-group',
    subMenu: [
      { title: 'Add Buyer', link: '/admin/add_buyer' },
      { title: 'Buyers List', link: '/admin/buyers' },
      { title: 'Inactive Buyers', link: '/admin/inactive_buyers' },
      { title: 'Not Approved Buyers', link: '/admin/not_approved_buyers' },
      { title: 'Recently Deleted Buyers', link: '/admin/removed_buyers' },
    ],
  },
  {
    title: 'Sellers',
    icon: 'bx bx-group',
    subMenu: [
      { title: 'Add Seller', link: '/admin/add_seller' },
      { title: 'Sellers List', link: '/admin/sellers' },
      { title: 'Inactive Sellers', link: '/admin/inactive_sellers' },
      { title: 'Not Completed Sellers', link: '/admin/not_completed_sellers' },
      { title: 'Not Approved Sellers', link: '/admin/not_approved_sellers' },
      { title: 'Recently Deleted Sellers', link: '/admin/removed_sellers' },
    ],
  },
  {
    title: 'Leads Master',
    icon: 'bx bx-user',
    subMenu: [
      { title: 'Leads', link: '/admin/leads' },
      { title: 'Approve Leads', link: '/admin/approve_leads' },
      { title: 'Pending Leads', link: '/admin/enquiries-list' },
      { title: 'Public Enquiries', link: '/admin/public_enquiries' },
      { title: 'Open Enquiries', link: '/admin/open_enquiries' },      
    ],
  },
  {
    title: 'Management Portal',
    icon: 'bx bx-user',
    subMenu: [
      { title: 'Roles List', link: '/admin/roles' },
      { title: 'Sub Admin List', link: '/admin/sub_admin' },
    ],
  },
  {
    title: 'Shop',
    icon: 'bx bx-cart',
    subMenu: [
      { title: 'Product List', link: '/admin/products' },
      { title: 'Add Product', link: '/admin/add_product' },
      { title: 'Product Categories', link: '/admin/product_categories' },
      { title: 'Product Sub Categories', link: '/admin/product_sub_categories' },
    ],
  },
  {
    title: 'Support System',
    icon: 'bx bx-bulb',
    subMenu: [
      { title: 'Ticket List', link: '/admin/tickets' },
      { title: 'Ticket Categories', link: '/admin/ticket_categories' },
    ],
  },  
  {
    title: 'FAQ',
    icon: 'bx bx-question-mark',
    subMenu: [
      { title: 'Manage FAQ', link: '/admin/faqs' },
      { title: 'FAQ Categories', link: '/admin/faq_categories' },
    ],
  },
  {
    title: 'Home Banner',
    icon: 'bx bx-slider',
    link: '/admin/home_banners',
  },
  {
    title: 'Knowledge Center',
    icon: 'bx bx-info-square',
    link: '/admin/knowledge_center',
  },
  {
    title: 'Emails Templates',
    icon: 'bx bx-mail-send',
    link: '/admin/emails-list',
  },
  {
    title: 'Membership Plan',
    icon: 'bx bx-user-plus',
    link: '/admin/membership_plan',
  },
  {
    title: 'Contact Us',
    icon: 'bx bx-phone',
    link: '/admin/contacts-list',
  },
  {
    title: 'Email Circular',
    icon: 'bx bx-envelope',
    subMenu: [
      { title: 'Email Circular', link: '/admin/email_circular' },
      { title: 'Add Email Circular', link: '/admin/add_email_circular' },
    ],
  },
  {
    title: 'Activity',
    icon: 'bx bx-task',
    subMenu: [
      { title: 'Core Activity', link: '/admin/core_activity' },
      { title: 'Activity', link: '/admin/activity' },
    ],
  },
  {
    title: 'Category Master',
    icon: 'bx bx-list-ul',
    subMenu: [      
      { title: 'Interest Categories', link: '/admin/interest_categories' },      
      { title: 'Source Interest Categories', link: '/admin/source_interest_categories' },
      { title: 'Items', link: '/admin/items' },
    ],
  },
  {
    title: 'Applications',
    icon: 'bx bx-mobile',
    link: '/admin/applications',
  },
  {
    title: 'Testimonials',
    icon: 'bx bxs-quote-alt-left',
    link: '/admin/testimonials',
  },
  {
    title: 'Settings',
    icon: 'bx bx-cog',
    subMenu: [
      { title: 'Site Settings', link: '/admin/site_settings' },
      { title: 'About Settings', link: '/admin/about_settings' },
      { title: 'Home Settings', link: '/admin/home_settings' },
    ],
  },
  {
    title: 'Seo Pages',
    icon: 'bx bxs-file',
    link: '/admin/seo_pages',
  },
  {
    title: 'Inventory',
    icon: 'bx bxs-cloud-upload',
    link: '/admin/inventory-list',
  },
  {
    title: 'User History',
    icon: 'bx bxs-user',
    link: '/admin/user_history',
  },
  {
    title: 'User Activities',
    icon: 'bx bxs-user-check',
    link: '/admin/user_activity',
  },
];

const SidebarItem = ({ item, currentPath, isOpen, onClick }) => {
  const hasSubMenu = item.subMenu && item.subMenu.length > 0;

  const isSubMenuActive =
    hasSubMenu && item.subMenu.some((sub) => sub.link === currentPath);

  const itemLinks = Array.isArray(item.link) ? item.link : [item.link];
  const isItemActive = itemLinks.includes(currentPath) || isSubMenuActive;
  const shouldExpand = isOpen || isSubMenuActive;

  return (
    <li className={isItemActive ? 'mm-active' : ''}>
      <Link
        to={hasSubMenu ? '#' : (Array.isArray(item.link) ? item.link[0] : item.link) || '#'}
        className={hasSubMenu ? 'has-arrow' : ''}
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
        <ul className={`mm-collapse ${shouldExpand ? 'mm-show' : ''}`}>
          {item.subMenu?.map((sub, idx) => (
            <li
              key={idx}
              className={sub.link === currentPath ? 'mm-active' : ''}
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

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

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
                    <img src="/logo.png" className="logo-icon" alt="logo icon" />
                  </div>
                 
                  <div className="toggle-icon ms-auto">
                    <i className="bx bx-arrow-to-left" />
                  </div>
                </div>
                {/*navigation*/}
                <ul className="metismenu" id="menu">
                  {menuData?.map((item, idx) => (
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

export default Sidebar;
