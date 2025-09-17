import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";
import LeadsList from '../dashboard/LeadsList';
import TotalRegisterBuyers from "../dashboard/TotalRegisterBuyers";

const Dashboard = () => {
  const [counts, setCounts] = useState({});

  const CountData = ({ label, value, icon }) => (
    <div className="col mb-3">
      <div className="card radius-10 overflow-hidden">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div>
              <p className="mb-0">{label}</p>
              <h5 className="mb-0">{value}</h5>
            </div>
            <div className="ms-auto">
              <i className={`font-30 ${icon}`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [sellers, buyers, categories, subCats, products, enquiries] = await Promise.all([
          axios.get(`${API_BASE_URL}/sellers/count`),
          axios.get(`${API_BASE_URL}/buyers/count`),
          axios.get(`${API_BASE_URL}/categories/count`),
          axios.get(`${API_BASE_URL}/sub_categories/count`),
          axios.get(`${API_BASE_URL}/products/count`),
          axios.get(`${API_BASE_URL}/enquiries/count`),
        ]);
        setCounts({
          sellers: {
            total: sellers.data.total,
            addedToday: sellers.data.addedToday,
            statusActive: sellers.data.statusActive,
            statusInactive: sellers.data.statusInactive,
            notApproved: sellers.data.notApproved,
          },
          buyers: {
            total: buyers.data.total,
            addedToday: buyers.data.addedToday,
            statusActive: buyers.data.statusActive,
            statusInactive: buyers.data.statusInactive,
            notApproved: buyers.data.notApproved,
          },
          categories: categories.data.total,
          subCategories: subCats.data.total,
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
    { label: "Today Register Seller Members", value: counts.sellers?.addedToday, icon: "bx bxs-user-plus" },
    { label: "Today Register Buyer Members", value: counts.buyers?.addedToday, icon: "bx bxs-user-plus" },
    { label: "Total Seller Members", value: counts.sellers?.total, icon: "bx bxs-group" },
    { label: "Active Seller Members", value: counts.sellers?.statusActive, icon: "bx bxs-user-check" },
    { label: "Inactive Seller Members", value: counts.sellers?.statusInactive, icon: "bx bxs-user-x" },
    { label: "Not Approved Seller Members", value: counts.sellers?.notApproved, icon: "bx bxs-user-minus" },
    // { label: "Not Complete Seller", value: "", icon: "bx bxs-user-x" },
    { label: "Total Buyer Members", value: counts.buyers?.total, icon: "bx bxs-group" },
    { label: "Active Buyer Members", value: counts.buyers?.statusActive, icon: "bx bxs-user-check" },
    { label: "Inactive Buyer Members", value: counts.buyers?.statusInactive, icon: "bx bxs-user-x" },
    { label: "Not Approved Buyer Members", value: counts.buyers?.notApproved, icon: "bx bxs-user-minus" },
    { label: "Total Category", value: counts.categories, icon: "bx bxs-category" },
    { label: "Total Sub Category", value: counts.subCategories, icon: "bx bx-list-ul" },
    { label: "Total Products", value: counts.products?.total, icon: "bx bxs-shopping-bag" },
    { label: "Total Public Products", value: counts.products?.statusPublic, icon: "bx bxs-group" },
    { label: "Total Draft Products", value: counts.products?.statusDraft, icon: "bx bxs-shopping-bag" },
    { label: "Enquiries (created) Generated", value: counts.enquiries, icon: "bx bx-search" },
    { label: "Product added this month", value: counts.products?.addedThisMonth, icon: "bx bxs-shopping-bags" },
    // { label: "Today Mail Send", value: "", icon: "bx bx-mail-send" },
    // { label: "2024 Registration", value: "", icon: "bx bxs-user-plus" },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
          {stats?.map((s, idx) => (
            <CountData key={idx} label={s.label} value={s.value || 0} icon={s.icon} />
          ))}
        </div>
        <LeadsList />
        <TotalRegisterBuyers />
      </div>
    </div>
  );
};

export default Dashboard;
