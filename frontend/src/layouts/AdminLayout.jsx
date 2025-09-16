import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import 'simplebar/dist/simplebar.min.css';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css'
import 'datatables.net-bs5'
import '../assets/css/app.css';
import '../assets/css/icons.css';
import '../assets/css/metisMenu.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';

import Header from '../admin/common/Header';
import Sidebar from '../admin/common/Sidebar';
import Footer from '../admin/common/Footer';
import Login from '../admin/pages/Login';
import NotFound from '../admin/pages/NotFound';
import Dashboard from '../admin/pages/Dashboard';
import BuyerList from '../admin/pages/BuyerList';
import AddBuyer from '../admin/pages/AddBuyer';
import SellerList from '../admin/pages/SellerList';
import AddSeller from '../admin/pages/AddSeller';
import ProductList from '../admin/pages/ProductList';
import AddProduct from '../admin/pages/AddProduct';
import ProductCategoryList from '../admin/pages/ProductCategoryList';
import ProductSubCategoryList from '../admin/pages/ProductSubCategoryList';
import TicketList from '../admin/pages/TicketList';
import TicketCategoryList from '../admin/pages/TicketCategoryList';
import SiteSettings from '../admin/pages/SiteSettings';
import FaqList from '../admin/pages/FaqList';
import FaqCategoryList from '../admin/pages/FaqCategoryList';
import KnowledgeCenter from '../admin/pages/KnowledgeCenter';
import AboutSettings from '../admin/pages/AboutSettings';
import HomeBanners from '../admin/pages/HomeBanners';
import MembershipPlan from '../admin/pages/MembershipPlan';
import EmailCircular from '../admin/pages/EmailCircular';
import AddEmailCircular from '../admin/pages/AddEmailCircular';
import EmailCircularDetails from '../admin/pages/EmailCircularDetails';
import HomeSettings from '../admin/pages/HomeSettings';
import SubAdminList from '../admin/pages/SubAdminList';
import RolesList from '../admin/pages/RolesList';
import CoreActivityList from '../admin/pages/CoreActivityList';
import ActivityList from '../admin/pages/ActivityList';
import ItemList from '../admin/pages/ItemList';
import SourceInterestCategories from '../admin/pages/SourceInterestCategories';
import ApplicationList from '../admin/pages/ApplicationList';
import Reports from '../admin/pages/Reports';
import TestimonialList from '../admin/pages/TestimonialList';
import InterestCategories from '../admin/pages/InterestCategories';
import LeadsList from '../admin/pages/LeadsList';
import ViewEnquiry from '../admin/pages/ViewEnquiry';
import OpenEnquiry from '../admin/pages/OpenEnquiry';
import SeoPages from '../admin/pages/SeoPages';
import UserActivities from '../admin/pages/UserActivities';
import UserActivityDetails from '../admin/pages/UserActivityDetails';
import UsersHistory from '../admin/pages/UsersHistory';
import EmailsList from '../admin/pages/EmailsList';
import AddEmail from '../admin/pages/AddEmail';
import ContactsList from '../admin/pages/ContactsList';

function AdminLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname.includes('/admin/login');
  const isAtAdminRoot = location.pathname === '/admin';
  const isAuthenticated = () => !!localStorage.getItem('token');
  const showLayout = isAuthenticated() && (!isLoginPage || isAtAdminRoot);
  const ProtectedRoute = ({ children }) => isAuthenticated() ? children : <Navigate to="/admin/login" replace />;
  const PublicRoute = ({ children }) => isAuthenticated() ? <Navigate to="/admin/dashboard" replace /> : children;

  return (
    <>
    <AlertProvider>
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
      <div className="wrapper">
        {showLayout && <Header />}
        {showLayout && <Sidebar />}
        <Routes>
          <Route path="/" element={ isAuthenticated() ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <PublicRoute><Login /></PublicRoute> } />
          <Route path="*" element={ isAuthenticated() ? <NotFound /> : <Navigate to="/admin/login" replace /> } />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/buyers" element={<ProtectedRoute><BuyerList /></ProtectedRoute>} />
          <Route path="/inactive_buyers" element={<ProtectedRoute><BuyerList getInactive={true} /></ProtectedRoute>} />
          <Route path="/not_approved_buyers" element={<ProtectedRoute><BuyerList getNotApproved={true} /></ProtectedRoute>} />
          <Route path="/removed_buyers" element={<ProtectedRoute><BuyerList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/add_buyer" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
          <Route path="/edit_buyer/:buyerId" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
          <Route path="/sellers" element={<ProtectedRoute><SellerList /></ProtectedRoute>} />
          <Route path="/inactive_sellers" element={<ProtectedRoute><SellerList getInactive={true} /></ProtectedRoute>} />
          <Route path="/not_approved_sellers" element={<ProtectedRoute><SellerList getNotApproved={true} /></ProtectedRoute>} />
          <Route path="/removed_sellers" element={<ProtectedRoute><SellerList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/add_seller" element={<ProtectedRoute><AddSeller /></ProtectedRoute>} />
          <Route path="/edit_seller/:sellerId" element={<ProtectedRoute><AddSeller /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />          
          <Route path="/add_product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/edit_product/:productId" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/product_categories" element={<ProtectedRoute><ProductCategoryList /></ProtectedRoute>} />
          <Route path="/product_sub_categories" element={<ProtectedRoute><ProductSubCategoryList /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
          <Route path="/ticket_categories" element={<ProtectedRoute><TicketCategoryList /></ProtectedRoute>} />
          <Route path="/site_settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
          <Route path="/faqs" element={<ProtectedRoute><FaqList /></ProtectedRoute>} />
          <Route path="/faq_categories" element={<ProtectedRoute><FaqCategoryList /></ProtectedRoute>} />
          <Route path="/knowledge_center" element={<ProtectedRoute><KnowledgeCenter /></ProtectedRoute>} />
          <Route path="/about_settings" element={<ProtectedRoute><AboutSettings /></ProtectedRoute>} />
          <Route path="/home_banners" element={<ProtectedRoute><HomeBanners /></ProtectedRoute>} />
          <Route path="/membership_plan" element={<ProtectedRoute><MembershipPlan /></ProtectedRoute>} />
          <Route path="/email_circular" element={<ProtectedRoute><EmailCircular /></ProtectedRoute>} />
          <Route path="/add_email_circular" element={<ProtectedRoute><AddEmailCircular /></ProtectedRoute>} />
          <Route path="/edit_email_circular/:newsletterId" element={<ProtectedRoute><AddEmailCircular /></ProtectedRoute>} />
          <Route path="/email_circular_details/:newsletterId" element={<ProtectedRoute><EmailCircularDetails /></ProtectedRoute>} />
          <Route path="/home_settings" element={<ProtectedRoute><HomeSettings /></ProtectedRoute>} />
          <Route path="/sub_admin" element={<ProtectedRoute><SubAdminList /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><RolesList /></ProtectedRoute>} />
          <Route path="/core_activity" element={<ProtectedRoute><CoreActivityList /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityList /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><ItemList /></ProtectedRoute>} />
          <Route path="/source_interest_categories" element={<ProtectedRoute><SourceInterestCategories /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><ApplicationList /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/testimonials" element={<ProtectedRoute><TestimonialList /></ProtectedRoute>} />
          <Route path="/interest_categories" element={<ProtectedRoute><InterestCategories /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><LeadsList /></ProtectedRoute>} />
          <Route path="/approve_leads" element={<ProtectedRoute><LeadsList getApprove={true} /></ProtectedRoute>} />
          <Route path="/public_enquiries" element={<ProtectedRoute><LeadsList getPublic={true} /></ProtectedRoute>} />
          <Route path="/admin-view-enquiry/:enquiry_number" element={<ProtectedRoute><ViewEnquiry /></ProtectedRoute>} />
          <Route path="/open_enquiries" element={<ProtectedRoute><OpenEnquiry /></ProtectedRoute>} />
          <Route path="/seo_pages" element={<ProtectedRoute><SeoPages /></ProtectedRoute>} />
          <Route path="/user_activity" element={<ProtectedRoute><UserActivities /></ProtectedRoute>} />
          <Route path="/user-activity-details/:userId" element={<ProtectedRoute><UserActivityDetails /></ProtectedRoute>} />
          <Route path="/user_history" element={<ProtectedRoute><UsersHistory /></ProtectedRoute>} />
          <Route path="/emails-list" element={<ProtectedRoute><EmailsList /></ProtectedRoute>} />
          <Route path="/add_email" element={<ProtectedRoute><AddEmail /></ProtectedRoute>} />
          <Route path="/email-edit/:emailId" element={<ProtectedRoute><AddEmail /></ProtectedRoute>} />
          <Route path="/contacts-list" element={<ProtectedRoute><ContactsList /></ProtectedRoute>} />
          <Route path="/contact-remove-list" element={<ProtectedRoute><ContactsList getDeleted={true} /></ProtectedRoute>} />
        </Routes>
      </div>
      {showLayout && <Footer />}
    </AlertProvider>
    </>
  );
}

export default AdminLayout;
