import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from '../common/Breadcrumb';
import API_BASE_URL from "../../config";
import SellerStockChart from '../dashboard/SellerStockChart';
import BuyerStockChart from '../dashboard/BuyerStockChart';
import EnquiryStockChart from '../dashboard/EnquiryStockChart';
import LeadsList from '../dashboard/LeadsList';
import TotalRegisterBuyers from "../dashboard/TotalRegisterBuyers";
import TotalRegisterSellers from "../dashboard/TotalRegisterSellers";

const Dashboard = () => {
  const [counts, setCounts] = useState({});
  const buyerSectionRef = useRef(null);
  const sellerSectionRef = useRef(null);

  const CountData = ({ label, value, icon, link, onClick }) => {
    const randomNum = Math.floor(Math.random() * 4) + 1;
    const imgSrc = `/element-0${randomNum}.svg`;

    const colorMap = {
      1: "bg-soft-primary border border-primary text-primary",
      2: "bg-soft-success border border-success text-success",
      3: "bg-soft-purple border border-purple text-purple",
      4: "bg-soft-warning border border-warning text-warning",
    };

    const colorClass = colorMap[randomNum];

    const content = (
      <div className="card radius-2 overflow-hidden position-relative h-100 card-border">
        <div className="card-body ps-4 py-4">
          <div className="d-flex align-items-center">
            <div className="labeltitle">
              <p className="mb-2">{label}</p>
              <h2 className="mb-0">{value}</h2>
            </div>
            <div className={`ms-auto dashicon avatar avatar-md rounded-circle ${colorClass}`}>
              <i className={`${icon}`}></i>
            </div>
          </div>
        </div>
        <img
          src={imgSrc}
          className="img-fluid position-absolute top-0 start-0"
          alt="logo icon"
          loading="lazy"
          decoding="async"
        />
      </div>
    );

    return (
      <div className="col mb-4">
        {onClick ? (
          <div style={{ cursor: "pointer" }} onClick={onClick}>
            {content}
          </div>
        ) : link && link !== "#" ? (
          <Link to={link}>{content}</Link>
        ) : (
          <div style={{ cursor: "pointer" }}>{content}</div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [sellers, buyers, categories, subCats, itemCats, itemSubCats, items, products, enquiries] = await Promise.all([
          axios.get(`${API_BASE_URL}/sellers/count`),
          axios.get(`${API_BASE_URL}/buyers/count`),
          axios.get(`${API_BASE_URL}/categories/count`),
          axios.get(`${API_BASE_URL}/sub_categories/count`),
          axios.get(`${API_BASE_URL}/item_category/count`),
          axios.get(`${API_BASE_URL}/item_sub_category/count`),
          axios.get(`${API_BASE_URL}/items/count`),
          axios.get(`${API_BASE_URL}/products/count`),
          axios.get(`${API_BASE_URL}/enquiries/count`),
        ]);
        setCounts({
          sellers: {
            total: (sellers.data.statusActive || 0) +
              (sellers.data.statusInactive || 0) +
              (sellers.data.notApproved || 0) +
              (sellers.data.notCompleted || 0) +
              (sellers.data.deleted || 0),
            addedToday: sellers.data.addedToday,
            statusActive: sellers.data.statusActive,
            statusInactive: sellers.data.statusInactive,
            notApproved: sellers.data.notApproved,
            notCompleted: sellers.data.notCompleted,
          },
          buyers: {
            total: (buyers.data.statusActive || 0) +
              (buyers.data.statusInactive || 0) +
              (buyers.data.notApproved || 0) +
              (buyers.data.deleted || 0),
            addedToday: buyers.data.addedToday,
            statusActive: buyers.data.statusActive,
            statusInactive: buyers.data.statusInactive,
            notApproved: buyers.data.notApproved,
          },
          categories: categories.data.total,
          subCategories: subCats.data.total,
          itemCategories: itemCats.data.total,
          itemSubCategories: itemSubCats.data.total,
          items: items.data.total,
          products: {
            total: products.data.total,
            statusPublic: products.data.statusPublic,
            statusDraft: products.data.statusDraft,
            addedThisMonth: products.data.addedThisMonth,
          },
          enquiries: enquiries.data.total,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchCounts();
  }, []);

  const stats = [
    {
      label: "Today Seller Members",
      value: counts.sellers?.addedToday,
      icon: "bx bxs-user-plus",
      onClick: () => sellerSectionRef.current?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      label: "Today Buyer Members",
      value: counts.buyers?.addedToday,
      icon: "bx bxs-user-plus",
      onClick: () => buyerSectionRef.current?.scrollIntoView({ behavior: "smooth" }),
    },
    { label: "Total Seller Members", value: counts.sellers?.total, icon: "bx bxs-group", link: "/admin/sellers" },
    { label: "Active Seller Members", value: counts.sellers?.statusActive, icon: "bx bxs-user-check", link: "/admin/sellers" },
    { label: "Inactive Seller Members", value: counts.sellers?.statusInactive, icon: "bx bxs-user-x", link: "/admin/inactive_sellers" },
    { label: "Not Approved Seller Members", value: counts.sellers?.notApproved, icon: "bx bxs-user-minus", link: "/admin/not_approved_sellers" },
    { label: "Not Complete Seller", value: counts.sellers?.notCompleted, icon: "bx bxs-user-x", link: "/admin/not_completed_sellers" },
    { label: "Total Buyer Members", value: counts.buyers?.total, icon: "bx bxs-group", link: "/admin/buyers" },
    { label: "Active Buyer Members", value: counts.buyers?.statusActive, icon: "bx bxs-user-check", link: "/admin/buyers" },
    { label: "Inactive Buyer Members", value: counts.buyers?.statusInactive, icon: "bx bxs-user-x", link: "/admin/inactive_buyers" },
    { label: "Not Approved Buyer Members", value: counts.buyers?.notApproved, icon: "bx bxs-user-minus", link: "/admin/not_approved_buyers" },
    { label: "Total Category", value: counts.categories, icon: "bx bxs-category", link: "/admin/product_categories" },
    { label: "Total Sub Category", value: counts.subCategories, icon: "bx bx-list-ul", link: "/admin/product_sub_categories" },
    { label: "Item Category", value: counts.itemCategories, icon: "bx bx-list-ul", link: "/admin/item_category" },
    { label: "Item Sub Category", value: counts.itemSubCategories, icon: "bx bx-list-ul", link: "/admin/item_sub_category" },
    { label: "Items", value: counts.items, icon: "bx bx-list-ul", link: "/admin/new_items" },
    { label: "Total Products", value: counts.products?.total, icon: "bx bxs-shopping-bag", link: "/admin/products" },
    { label: "Total Public Products", value: counts.products?.statusPublic, icon: "bx bxs-group", link: "/admin/approve-product-list" },
    { label: "Total Draft Products", value: counts.products?.statusDraft, icon: "bx bxs-shopping-bag", link: "/admin/notapprove-product-list" },
    { label: "Enquiries Generated", value: counts.enquiries, icon: "bx bx-search", link: "/admin/enquiries-list" },
    { label: "Product added this month", value: counts.products?.addedThisMonth, icon: "bx bxs-shopping-bags", link: "#" },

  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Dashboard" title="" />
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
          {stats?.map((s, idx) => (
            <CountData key={idx} label={s.label} value={s.value || 0} icon={s.icon} link={s.link} onClick={s.onClick} />
          ))}
        </div>
        <div className="row">
          <div className="col-md-6">

          </div>
        </div>
        <div id="sellerGraph" className="mb-3">
          <h6 className="mb-0 text-uppercase">Seller Graph</h6>
          <hr />
          <div className="card">
            <div className="card-body">
              <SellerStockChart />
            </div>
          </div>
        </div>
        <div id="buyerGraph" className="mb-3">
          <h6 className="mb-0 text-uppercase">Buyer Graph</h6>
          <hr />
          <div className="card">
            <div className="card-body">
              <BuyerStockChart />
            </div>
          </div>
        </div>
        <div id="enquiryGraph" className="mb-3">
          <h6 className="mb-0 text-uppercase">Leads Graph</h6>
          <hr />
          <div className="card">
            <div className="card-body">
              <EnquiryStockChart />
            </div>
          </div>
        </div>
        <LeadsList />
        <div ref={sellerSectionRef}>
          <TotalRegisterSellers />
        </div>
        <div ref={buyerSectionRef}>
          <TotalRegisterBuyers />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
