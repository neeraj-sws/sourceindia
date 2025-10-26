import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuData = [
  {
    title: 'Dashboard',
    icon: 'bx bx-home-circle',
    link: ['/dashboard'],
  },
  {
    title: 'Profile',
    icon: 'bx bx-user',
    link: '/profile',
  },
  {
    title: 'My Products',
    icon: 'bx bx-devices',
    link: '/my-product',
  },
  {
    title: 'Leads',
    icon: 'bx bx-devices',
    link: '/seller_enquiry',
  },
  {
    title: 'Lead Messages',
    icon: 'bx bx-devices',
    link: '#',
  },
  {
    title: 'Enquires',
    icon: 'bx bx-devices',
    link: '/my_enquiry',
  },
  {
    title: 'Enquiry Messages',
    icon: 'bx bx-devices',
    link: '#',
  },
  {
    title: 'Open Enquiries',
    icon: 'bx bx-devices',
    link: '#',
  },
  {
    title: 'My Open Enquiries',
    icon: 'bx bx-devices',
    link: '#',
  },
  {
    title: 'Add Open Enquiries',
    icon: 'bx bx-devices',
    link: '#',
  },
  {
    title: 'My All Enquiries Chats',
    icon: 'bx bx-devices',
    link: '#',
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

const UserSidebar = () => {
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

export default UserSidebar;
