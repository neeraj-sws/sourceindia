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
import BuyerProfile from '../admin/pages/BuyerProfile';
import SellerList from '../admin/pages/SellerList';
import AddSeller from '../admin/pages/AddSeller';
import SellerProfile from '../admin/pages/SellerProfile';
import ProductList from '../admin/pages/ProductList';
import AddProduct from '../admin/pages/AddProduct';
import ProductCategoryList from '../admin/pages/ProductCategoryList';
import ProductSubCategoryList from '../admin/pages/ProductSubCategoryList';
import TicketList from '../admin/pages/TicketList';
import TicketView from '../admin/pages/TicketView';
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
import MailHistory from '../admin/pages/MailHistory';
import EmailsList from '../admin/pages/EmailsList';
import AddEmail from '../admin/pages/AddEmail';
import ContactsList from '../admin/pages/ContactsList';
import Inventories from '../admin/pages/Inventories';
import RegistrationsList from '../admin/pages/RegistrationsList';
import UsersHistory from '../admin/pages/UsersHistory';
import ItemCategory from '../admin/pages/ItemCategory';
import ItemSubCategory from '../admin/pages/ItemSubCategory';
import NewItems from '../admin/pages/NewItems';
import ShortcutPage from '../admin/pages/ShortcutPage';
import PageEdit from '../admin/pages/PageEdit';
import FrontMenu from '../admin/pages/FrontMenu';
import SellerUnusedCategories from '../admin/pages/SellerUnusedCategories';
import ProductUnusedCategories from '../admin/pages/ProductUnusedCategories';
import ProductCategoriesGraph from '../admin/pages/ProductCategoriesGraph';
import SellerCategoriesGraph from '../admin/pages/SellerCategoriesGraph';

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
          <Route path="/buyer/user-profile/:buyerId" element={<ProtectedRoute><BuyerProfile /></ProtectedRoute>} />
          <Route path="/sellers" element={<ProtectedRoute><SellerList /></ProtectedRoute>} />
          <Route path="/inactive_sellers" element={<ProtectedRoute><SellerList getInactive={true} /></ProtectedRoute>} />
          <Route path="/not_approved_sellers" element={<ProtectedRoute><SellerList getNotApproved={true} /></ProtectedRoute>} />
          <Route path="/not_completed_sellers" element={<ProtectedRoute><SellerList getNotCompleted={true} /></ProtectedRoute>} />
          <Route path="/removed_sellers" element={<ProtectedRoute><SellerList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/add_seller" element={<ProtectedRoute><AddSeller /></ProtectedRoute>} />
          <Route path="/edit_seller/:sellerId" element={<ProtectedRoute><AddSeller /></ProtectedRoute>} />
          <Route path="/seller/user-profile/:sellerId" element={<ProtectedRoute><SellerProfile /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/approve-product-list" element={<ProtectedRoute><ProductList isApprove={1} /></ProtectedRoute>} />
          <Route path="/notapprove-product-list" element={<ProtectedRoute><ProductList isApprove={0} /></ProtectedRoute>} />
          <Route path="/product-remove" element={<ProtectedRoute><ProductList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/product-list" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
          <Route path="/add_product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/edit_product/:productId" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/product_categories" element={<ProtectedRoute><ProductCategoryList /></ProtectedRoute>} />
          <Route path="/category-remove-list" element={<ProtectedRoute><ProductCategoryList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/product_sub_categories" element={<ProtectedRoute><ProductSubCategoryList /></ProtectedRoute>} />
          <Route path="/subcategory-remove-list" element={<ProtectedRoute><ProductSubCategoryList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
          <Route path="/ticket/view/:ticketId" element={<ProtectedRoute><TicketView /></ProtectedRoute>} />
          <Route path="/ticket_categories" element={<ProtectedRoute><TicketCategoryList /></ProtectedRoute>} />
          <Route path="/site_settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
          <Route path="/faqs" element={<ProtectedRoute><FaqList /></ProtectedRoute>} />
          <Route path="/faq-remove-list" element={<ProtectedRoute><FaqList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/faq_categories" element={<ProtectedRoute><FaqCategoryList /></ProtectedRoute>} />
          <Route path="/knowledge_center" element={<ProtectedRoute><KnowledgeCenter /></ProtectedRoute>} />
          <Route path="/knowledgecenter-remove-list" element={<ProtectedRoute><KnowledgeCenter getDeleted={true} /></ProtectedRoute>} />
          <Route path="/about_settings" element={<ProtectedRoute><AboutSettings /></ProtectedRoute>} />
          <Route path="/home_banners" element={<ProtectedRoute><HomeBanners /></ProtectedRoute>} />
          <Route path="/homebanner-remove-list" element={<ProtectedRoute><HomeBanners getDeleted={true} /></ProtectedRoute>} />
          <Route path="/membership_plan" element={<ProtectedRoute><MembershipPlan /></ProtectedRoute>} />
          <Route path="/membership-plan-remove-list" element={<ProtectedRoute><MembershipPlan getDeleted={true} /></ProtectedRoute>} />
          <Route path="/email_circular" element={<ProtectedRoute><EmailCircular /></ProtectedRoute>} />
          <Route path="/add_email_circular" element={<ProtectedRoute><AddEmailCircular /></ProtectedRoute>} />
          <Route path="/edit_email_circular/:newsletterId" element={<ProtectedRoute><AddEmailCircular /></ProtectedRoute>} />
          <Route path="/email_circular_details/:newsletterId" element={<ProtectedRoute><EmailCircularDetails /></ProtectedRoute>} />
          <Route path="/home_settings" element={<ProtectedRoute><HomeSettings /></ProtectedRoute>} />
          <Route path="/shortcut-page" element={<ProtectedRoute><ShortcutPage /></ProtectedRoute>} />
          <Route path="/sub_admin" element={<ProtectedRoute><SubAdminList /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><RolesList /></ProtectedRoute>} />
          <Route path="/core_activity" element={<ProtectedRoute><CoreActivityList /></ProtectedRoute>} />
          <Route path="/coreactivity-remove-list" element={<ProtectedRoute><CoreActivityList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityList /></ProtectedRoute>} />
          <Route path="/activity-remove-list" element={<ProtectedRoute><ActivityList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><ItemList /></ProtectedRoute>} />
          <Route path="/item-remove-list" element={<ProtectedRoute><ItemList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/source_interest_categories" element={<ProtectedRoute><SourceInterestCategories /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><ApplicationList /></ProtectedRoute>} />
          <Route path="/application-remove-list" element={<ProtectedRoute><ApplicationList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/testimonials" element={<ProtectedRoute><TestimonialList /></ProtectedRoute>} />
          <Route path="/interest_categories" element={<ProtectedRoute><InterestCategories /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><LeadsList /></ProtectedRoute>} />
          <Route path="/approve_leads" element={<ProtectedRoute><LeadsList getApprove={true} /></ProtectedRoute>} />
          <Route path="/enquiries-list" element={<ProtectedRoute><LeadsList getNotApprove={true} /></ProtectedRoute>} />
          <Route path="/public_enquiries" element={<ProtectedRoute><LeadsList getPublic={true} /></ProtectedRoute>} />
          <Route path="/enquiry-remove-list" element={<ProtectedRoute><LeadsList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/admin-view-enquiry/:enquiry_number" element={<ProtectedRoute><ViewEnquiry /></ProtectedRoute>} />
          <Route path="/open_enquiries" element={<ProtectedRoute><OpenEnquiry /></ProtectedRoute>} />
          <Route path="/open-enquiry-remove-list" element={<ProtectedRoute><OpenEnquiry getDeleted={true} /></ProtectedRoute>} />
          <Route path="/seo_pages" element={<ProtectedRoute><SeoPages /></ProtectedRoute>} />
          <Route path="/user_activity" element={<ProtectedRoute><UserActivities /></ProtectedRoute>} />
          <Route path="/user-activity-details/:userId" element={<ProtectedRoute><UserActivityDetails /></ProtectedRoute>} />
          <Route path="/mail_history" element={<ProtectedRoute><MailHistory /></ProtectedRoute>} />
          <Route path="/mail-history-remove-list" element={<ProtectedRoute><MailHistory getDeleted={true} /></ProtectedRoute>} />
          <Route path="/emails-list" element={<ProtectedRoute><EmailsList /></ProtectedRoute>} />
          <Route path="/add_email" element={<ProtectedRoute><AddEmail /></ProtectedRoute>} />
          <Route path="/email-edit/:emailId" element={<ProtectedRoute><AddEmail /></ProtectedRoute>} />
          <Route path="/contacts-list" element={<ProtectedRoute><ContactsList /></ProtectedRoute>} />
          <Route path="/contact-remove-list" element={<ProtectedRoute><ContactsList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/inventory-list" element={<ProtectedRoute><Inventories /></ProtectedRoute>} />
          <Route path="/registrations-list" element={<ProtectedRoute><RegistrationsList /></ProtectedRoute>} />
          <Route path="/registrations-remove-list" element={<ProtectedRoute><RegistrationsList getDeleted={true} /></ProtectedRoute>} />
          <Route path="/user_history" element={<ProtectedRoute><UsersHistory /></ProtectedRoute>} />
          <Route path="/item_category" element={<ProtectedRoute><ItemCategory /></ProtectedRoute>} />
          <Route path="/item_sub_category" element={<ProtectedRoute><ItemSubCategory /></ProtectedRoute>} />
          <Route path="/new_items" element={<ProtectedRoute><NewItems /></ProtectedRoute>} />
          <Route path="/terms_conditions" element={<ProtectedRoute><PageEdit pageId={9} title="Terms & Conditions" /></ProtectedRoute>} />
          <Route path="/privacy_policy" element={<ProtectedRoute><PageEdit pageId={8} title="Privacy Policy" /></ProtectedRoute>} />
          <Route path="/front_menu" element={<ProtectedRoute><FrontMenu /></ProtectedRoute>} />
          <Route path="/seller_category_report" element={<ProtectedRoute><SellerUnusedCategories /></ProtectedRoute>} />
          <Route path="/product_category_report" element={<ProtectedRoute><ProductUnusedCategories /></ProtectedRoute>} />
          <Route path="/product_category_graph" element={<ProtectedRoute><ProductCategoriesGraph /></ProtectedRoute>} />
          <Route path="/seller_category_graph" element={<ProtectedRoute><SellerCategoriesGraph /></ProtectedRoute>} />
        </Routes>
      </div>
      {showLayout && <Footer />}
    </AlertProvider>
    </>
  );
}

export default AdminLayout;
