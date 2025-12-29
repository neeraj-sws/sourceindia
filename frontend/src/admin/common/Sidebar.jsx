import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "../../config";

const menuData = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    icon: 'bx bx-home-circle',
    link: ['/admin', '/admin/dashboard'],
  },
  {
    key: 'buyers',
    title: 'Buyers',
    icon: 'bx bx-group',
    subMenu: [
      { key: 'add_buyer', title: 'Add Buyer', link: '/admin/add_buyer' },
      { key: 'buyers_list', title: 'Buyers List', link: '/admin/buyers' },
      { key: 'inactive_buyers', title: 'Inactive Buyers', link: '/admin/inactive_buyers' },
      { key: 'not_approved_buyers', title: 'Not Approved Buyers', link: '/admin/not_approved_buyers' },
      { key: 'removed_buyers', title: 'Recently Deleted Buyers', link: '/admin/removed_buyers' },
    ],
  },
  {
    key: 'sellers',
    title: 'Sellers',
    icon: 'bx bx-group',
    subMenu: [
      { key: 'add_seller', title: 'Add Seller', link: '/admin/add_seller' },
      { key: 'sellers_list', title: 'Sellers List', link: '/admin/sellers' },
      { key: 'inactive_sellers', title: 'Inactive Sellers', link: '/admin/inactive_sellers' },
      { key: 'not_completed_sellers', title: 'Not Completed Sellers', link: '/admin/not_completed_sellers' },
      { key: 'not_approved_sellers', title: 'Not Approved Sellers', link: '/admin/not_approved_sellers' },
      { key: 'removed_sellers', title: 'Recently Deleted Sellers', link: '/admin/removed_sellers' },
    ],
  },
  {
    key: 'public_enquiries',
    title: 'Public Enquiries',
    icon: 'bx bx-user',
    link: '/admin/public_enquiries',
  },
  {
    key: 'leads',
    title: 'Leads Master',
    icon: 'bx bx-user',
    subMenu: [
      // { title: 'Leads', link: '/admin/leads' },
      { key: 'approve_leads', title: 'Approve Leads', link: '/admin/approve_leads' },
      { key: 'enquiries_list', title: 'Pending Leads', link: '/admin/enquiries-list' },
    ],
  },
  {
    key: 'open_enquiries',
    title: 'Open Enquiries',
    icon: 'bx bx-user',
    subMenu: [
      { key: 'open_enquiry_list', title: 'Open Enquiry List', link: '/admin/open_enquiries' },
      { key: 'delete_open_enquiry', title: 'Delete Open Enquiry', link: '/admin/open-enquiry-remove-list' },
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
    key: 'categories_total', 
    title: 'Category Master',
    icon: 'bx bx-cart',
    subMenu: [
      { key: 'categories', title: 'Categories', link: '/admin/product_categories' },
      { key: 'sub_categories', title: 'Sub Categories', link: '/admin/product_sub_categories' },
      { key: 'interest_categories', title: 'Interest Categories', link: '/admin/interest_categories' },
      { key: 'source_interest_categories', title: 'Source Interest Categories', link: '/admin/source_interest_categories' },
      { key: 'items', title: 'Items', link: '/admin/items' },
      { key: 'item_category', title: 'Item Categories', link: '/admin/item_category' },
      { key: 'item_sub_category', title: 'Item Sub Categories', link: '/admin/item_sub_category' },
      { key: 'new_items', title: 'New Items', link: '/admin/new_items' },
    ],
  },
  {
    title: 'Products',
    icon: 'bx bx-cart',
    subMenu: [
      { key: 'add_product', title: 'Add Product', link: '/admin/add_product' },
      { key: 'total_product', title: 'Product List', link: '/admin/products' },
      { key: 'approve_product', title: 'Approve Products', link: '/admin/approve-product-list' },
      { key: 'notapprove_product', title: 'Not Approve Products', link: '/admin/notapprove-product-list' },
    ],
  },
  {
    key: 'tickets_list',
    title: 'Support System',
    icon: 'bx bx-bulb',
    subMenu: [
      { key: 'tickets', title: 'Ticket List', link: '/admin/tickets' },
      { key: 'ticket_categories', title: 'Ticket Categories', link: '/admin/ticket_categories' },
    ],
  },
  {
    key: 'faqs_list',
    title: 'FAQ',
    icon: 'bx bx-question-mark',
    subMenu: [
      { key: 'faqs', title: 'Manage FAQ', link: '/admin/faqs' },
      { key: 'faq_categories', title: 'FAQ Categories', link: '/admin/faq_categories' },
    ],
  },
  {
    key: 'home_banners',
    title: 'Home Banner',
    icon: 'bx bx-slider',
    link: '/admin/home_banners',
  },
  {
    key: 'knowledge_center',
    title: 'Knowledge Center',
    icon: 'bx bx-info-square',
    link: '/admin/knowledge_center',
  },
  {
    key: 'emails',
    title: 'Emails Templates',
    icon: 'bx bx-mail-send',
    link: '/admin/emails-list',
  },
  {
    key: 'membership_plan',
    title: 'Membership Plan',
    icon: 'bx bx-user-plus',
    link: '/admin/membership_plan',
  },
  {
    key: 'contacts',
    title: 'Contact Us',
    icon: 'bx bx-phone',
    link: '/admin/contacts-list',
  },
  {
    key: 'newsletters_list',
    title: 'Email Circular',
    icon: 'bx bx-envelope',
    subMenu: [
      { key: 'newsletters', title: 'Email Circular', link: '/admin/email_circular' },
      { key: 'add_email_circular', title: 'Add Email Circular', link: '/admin/add_email_circular' },
    ],
  },
  {
    key: 'registrations_all',
    title: 'Event 2024 Registrations',
    icon: 'bx bx-envelope',
    subMenu: [
      { key: 'registrations', title: 'Registrations', link: '/admin/registrations-list' },
      { key: 'registrations_deleted', title: 'Deleted Registrations', link: '/admin/registrations-remove-list' },
    ],
  },
  {
    title: 'Activity',
    icon: 'bx bx-task',
    subMenu: [
      { key: 'core_activities', title: 'Core Activity', link: '/admin/core_activity' },
      { key: 'activities', title: 'Activity', link: '/admin/activity' },
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
      { title: 'ShortCut menu', link: '/admin/shortcut-page' },
      { title: 'Front menu', link: '/admin/front_menu' },
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
  {
    title: 'Pages',
    icon: 'bx bx-file-blank',
    subMenu: [
      { title: 'Terms & Conditions', link: '/admin/terms_conditions' },
      { title: 'Privacy Policy', link: '/admin/privacy_policy' },
    ],
  },
  {
    title: 'Reports',
    icon: 'bx bx-file-blank',
    subMenu: [
      { title: 'Seller Unused Categories', link: '/admin/seller_category_report' },
      { title: 'Product Unused Categories', link: '/admin/product_category_report' },
      { title: 'Seller Categories Graph', link: '/admin/seller_category_graph' },
      { title: 'Product Categories Graph', link: '/admin/product_category_graph' },
    ],
  },
];

const SidebarItem = ({ item, currentPath, isOpen, onClick, counts }) => {
  const hasSubMenu = item.subMenu && item.subMenu.length > 0;

  const isSubMenuActive =
    hasSubMenu && item.subMenu.some((sub) => sub.link === currentPath);

  const itemLinks = Array.isArray(item.link) ? item.link : [item.link];
  const isItemActive = itemLinks.includes(currentPath) || isSubMenuActive;
  const shouldExpand = isOpen;

  const getCount = (key) => {
  switch (key) {
    case 'buyers':
      return (
        (counts.buyers?.statusActive || 0) +
        (counts.buyers?.statusInactive || 0) +
        (counts.buyers?.notApproved || 0) +
        (counts.buyers?.deleted || 0)
      );
    case 'sellers':
      return (
        (counts.sellers?.statusActive || 0) +
        (counts.sellers?.statusInactive || 0) +
        (counts.sellers?.notApproved || 0) +
        (counts.sellers?.notCompleted || 0) +
        (counts.sellers?.deleted || 0)
      );
    case 'buyers_list':
      return counts.buyers?.statusActive || 0;
    case 'inactive_buyers':
      return counts.buyers?.statusInactive || 0;
    case 'not_approved_buyers':
      return counts.buyers?.notApproved || 0;
    case 'removed_buyers':
      return counts.buyers?.deleted || 0;
    case 'sellers_list':
      return counts.sellers?.statusActive || 0;
    case 'inactive_sellers':
      return counts.sellers?.statusInactive || 0;
    case 'not_approved_sellers':
      return counts.sellers?.notApproved || 0;
    case 'not_completed_sellers':
      return counts.sellers?.notCompleted || 0;
    case 'removed_sellers':
      return counts.sellers?.deleted || 0;
    case 'total_product':
      return counts.products?.total || 0;
    case 'approve_product':
      return counts.products?.statusPublic || 0;
    case 'notapprove_product':
      return counts.products?.statusDraft || 0;
    case 'leads':
      return (
        (counts.enquiries?.getApprove || 0) +
        (counts.enquiries?.getNotApprove || 0)
      );
    case 'public_enquiries':
      return counts.enquiries?.getPublic || 0;
    case 'approve_leads':
      return counts.enquiries?.getApprove || 0;
    case 'enquiries_list':
      return counts.enquiries?.getNotApprove || 0;
    case 'categories':
      return counts.categories?.total || 0;
    case 'sub_categories':
      return counts.subCategories?.total || 0;
    case 'items':
      return counts.items?.total || 0;
    case 'tickets':
      return counts.tickets?.total || 0;
    case 'ticket_categories':
      return counts.ticket_categories?.total || 0;
    case 'faqs_list':
      return counts.faqs?.total || 0;
    case 'faqs':
      return counts.faqs?.total || 0;
    case 'core_activities':
      return counts.core_activities?.total || 0;
    case 'activities':
      return counts.activities?.total || 0;
    case 'home_banners':
      return counts.home_banners?.total || 0;
    case 'knowledge_center':
      return counts.knowledge_center?.total || 0;
    case 'emails':
      return counts.emails?.total || 0;
    case 'membership_plan':
      return counts.membership_plan?.total || 0;
    case 'contacts':
      return counts.contacts?.total || 0;
    case 'newsletters_list':
      return counts.newsletters?.total || 0;
    case 'newsletters':
      return counts.newsletters?.total || 0;
    case 'registrations_all':
      return (
        (counts.registrations?.total || 0) +
        (counts.registrations?.deleted || 0)
      );
    case 'registrations':
      return counts.registrations?.total || 0;
    case 'registrations_deleted':
      return counts.registrations?.deleted || 0;
    default:
      return null;
  }
};

  const mainCount = getCount(item.key);

  return (
    <li className={`${isItemActive ? 'mm-active' : ''} ${shouldExpand ? 'mm-show' : ''}`}>
      <Link
        to={hasSubMenu ? '#' : (Array.isArray(item.link) ? item.link[0] : item.link) || '#'}
        className={hasSubMenu ? 'has-arrow' : ''}
        aria-expanded={shouldExpand}
        onClick={(e) => {
          if (hasSubMenu) { e.preventDefault(); onClick(); }
        }}
      >
        <div className="parent-icon"><i className={item.icon}></i></div>
        <div className="menu-title">
          {item.title}
          {mainCount !== null && ( <span className="badge bg-primary ms-1">{mainCount}</span> )}
        </div>
      </Link>

      {hasSubMenu && (
        <ul className={`mm-collapse ${shouldExpand ? 'mm-show' : ''}`}>
          {item.subMenu?.map((sub, idx) => {
            const subCount = getCount(sub.key);
            return (
              <li key={idx} className={sub.link === currentPath ? 'mm-active' : ''}>
                <Link to={sub.link}>
                  <i className="bx bx-right-arrow-alt" />
                  {sub.title}
                  {subCount !== null && (
                    <span className="badge bg-primary ms-1">{subCount}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openIndex, setOpenIndex] = useState(null);
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [counts, setCounts] = useState({
  buyers: {},
  sellers: {},
  products: {},
  categories: {},
  subCategories: {},
  enquiries: {},
  items: {},
  tickets: {},
  ticket_categories: {},
  faqs: {},
  core_activities: {},
  activities: {},
  home_banners: {},
  knowledge_center: {},
  emails: {},
  membership_plan: {},
  contacts: {},
  newsletters: {},
  registrations: {},
});

useEffect(() => {
  const fetchCounts = async () => {
    try {
      const [buyers, sellers, products, categories, subCategories, enquiries, items, tickets, ticket_categories, 
        faqs, core_activities, activities, home_banners, knowledge_center, emails, membership_plan, contacts, newsletters, registrations] = await Promise.all([
        axios.get(`${API_BASE_URL}/buyers/count`),
        axios.get(`${API_BASE_URL}/sellers/count`),
        axios.get(`${API_BASE_URL}/products/count`),
        axios.get(`${API_BASE_URL}/categories/count`),
        axios.get(`${API_BASE_URL}/sub_categories/count`),
        axios.get(`${API_BASE_URL}/enquiries/count`),
        axios.get(`${API_BASE_URL}/sub_sub_categories/count`),
        axios.get(`${API_BASE_URL}/tickets/count`),
        axios.get(`${API_BASE_URL}/ticket_categories/count`),
        axios.get(`${API_BASE_URL}/faqs/count`),
        axios.get(`${API_BASE_URL}/core_activities/count`),
        axios.get(`${API_BASE_URL}/activities/count`),
        axios.get(`${API_BASE_URL}/home_banners/count`),
        axios.get(`${API_BASE_URL}/knowledge_center/count`),
        axios.get(`${API_BASE_URL}/emails/count`),
        axios.get(`${API_BASE_URL}/membership_plan/count`),
        axios.get(`${API_BASE_URL}/contacts/count`),
        axios.get(`${API_BASE_URL}/newsletters/count`),
        axios.get(`${API_BASE_URL}/registrations/count`),
      ]);
      setCounts({
        buyers: buyers.data,
        sellers: sellers.data,
        products: products.data,
        categories: categories.data,
        subCategories: subCategories.data,
        enquiries: enquiries.data,
        items: items.data,
        tickets: tickets.data,
        ticket_categories: ticket_categories.data,
        faqs: faqs.data,
        core_activities: core_activities.data,
        activities: activities.data,
        home_banners: home_banners.data,
        knowledge_center: knowledge_center.data,
        emails: emails.data,
        membership_plan: membership_plan.data,
        contacts: contacts.data,
        newsletters: newsletters.data,
        registrations: registrations.data,
      });
    } catch (err) {
      console.error("Error fetching sidebar counts:", err);
    }
  };

  fetchCounts();
}, []);

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

  useEffect(() => {
  // Find the menu index that matches the currentPath
  const activeIndex = menuData.findIndex((item) => {
    if (item.subMenu) {
      return item.subMenu.some((sub) => sub.link === currentPath);
    }
    if (Array.isArray(item.link)) {
      return item.link.includes(currentPath);
    }
    return item.link === currentPath;
  });

  if (activeIndex !== -1) {
    setOpenIndex(activeIndex);
  }
}, [currentPath]);

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
                    <img src={logoUrl} className="logo-icon" alt="logo icon" onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/logo.png";
                    }} />
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
                      counts={counts}
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
