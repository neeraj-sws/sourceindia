import React, { Suspense, lazy } from 'react';
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

const Header = lazy(() => import('../admin/common/Header'));
const Sidebar = lazy(() => import('../admin/common/Sidebar'));
const Footer = lazy(() => import('../admin/common/Footer'));
const Login = lazy(() => import('../admin/pages/Login'));
const NotFound = lazy(() => import('../admin/pages/NotFound'));
const Dashboard = lazy(() => import('../admin/pages/Dashboard'));
const BuyerList = lazy(() => import('../admin/pages/BuyerList'));
const AddBuyer = lazy(() => import('../admin/pages/AddBuyer'));
const BuyerProfile = lazy(() => import('../admin/pages/BuyerProfile'));
const SellerList = lazy(() => import('../admin/pages/SellerList'));
const AddSeller = lazy(() => import('../admin/pages/AddSeller'));
const SellerProfile = lazy(() => import('../admin/pages/SellerProfile'));
const ProductList = lazy(() => import('../admin/pages/ProductList'));
const AddProduct = lazy(() => import('../admin/pages/AddProduct'));
const ProductCategoryList = lazy(() => import('../admin/pages/ProductCategoryList'));
const ProductSubCategoryList = lazy(() => import('../admin/pages/ProductSubCategoryList'));
const TicketList = lazy(() => import('../admin/pages/TicketList'));
const TicketView = lazy(() => import('../admin/pages/TicketView'));
const TicketCategoryList = lazy(() => import('../admin/pages/TicketCategoryList'));
const SiteSettings = lazy(() => import('../admin/pages/SiteSettings'));
const FaqList = lazy(() => import('../admin/pages/FaqList'));
const FaqCategoryList = lazy(() => import('../admin/pages/FaqCategoryList'));
const KnowledgeCenter = lazy(() => import('../admin/pages/KnowledgeCenter'));
const HomeBanners = lazy(() => import('../admin/pages/HomeBanners'));
import MembershipPlan from '../admin/pages/MembershipPlan';
const AdminBuyerEnquiries = lazy(() => import('../admin/pages/AdminBuyerEnquiries'));
const EmailCircular = lazy(() => import('../admin/pages/EmailCircular'));
const AddEmailCircular = lazy(() => import('../admin/pages/AddEmailCircular'));
const EmailCircularDetails = lazy(() => import('../admin/pages/EmailCircularDetails'));
const HomeSettings = lazy(() => import('../admin/pages/HomeSettings'));
const SubAdminList = lazy(() => import('../admin/pages/SubAdminList'));
const RolesList = lazy(() => import('../admin/pages/RolesList'));
const CoreActivityList = lazy(() => import('../admin/pages/CoreActivityList'));
const ActivityList = lazy(() => import('../admin/pages/ActivityList'));
const SourceInterestCategories = lazy(() => import('../admin/pages/SourceInterestCategories'));
const ApplicationList = lazy(() => import('../admin/pages/ApplicationList'));
const Reports = lazy(() => import('../admin/pages/Reports'));
const TestimonialList = lazy(() => import('../admin/pages/TestimonialList'));
const InterestCategories = lazy(() => import('../admin/pages/InterestCategories'));
const LeadsList = lazy(() => import('../admin/pages/LeadsList'));
const ViewEnquiry = lazy(() => import('../admin/pages/ViewEnquiry'));
const OpenEnquiry = lazy(() => import('../admin/pages/OpenEnquiry'));
const SeoPages = lazy(() => import('../admin/pages/SeoPages'));
const UserActivities = lazy(() => import('../admin/pages/UserActivities'));
const UserActivityDetails = lazy(() => import('../admin/pages/UserActivityDetails'));
const MailHistory = lazy(() => import('../admin/pages/MailHistory'));
const EmailsList = lazy(() => import('../admin/pages/EmailsList'));
const AddEmail = lazy(() => import('../admin/pages/AddEmail'));
const ContactsList = lazy(() => import('../admin/pages/ContactsList'));
const RegistrationsList = lazy(() => import('../admin/pages/RegistrationsList'));
const UsersHistory = lazy(() => import('../admin/pages/UsersHistory'));
const ItemCategory = lazy(() => import('../admin/pages/ItemCategory'));
const ItemSubCategory = lazy(() => import('../admin/pages/ItemSubCategory'));
const NewItems = lazy(() => import('../admin/pages/NewItems'));
const ShortcutPage = lazy(() => import('../admin/pages/ShortcutPage'));
const PageEdit = lazy(() => import('../admin/pages/PageEdit'));
const FrontMenu = lazy(() => import('../admin/pages/FrontMenu'));
const SellerUnusedCategories = lazy(() => import('../admin/pages/SellerUnusedCategories'));
const ProductUnusedCategories = lazy(() => import('../admin/pages/ProductUnusedCategories'));
const ProductCategoriesGraph = lazy(() => import('../admin/pages/ProductCategoriesGraph'));
const SellerCategoriesGraph = lazy(() => import('../admin/pages/SellerCategoriesGraph'));
const SourcingInterestsGraph = lazy(() => import('../admin/pages/SourcingInterestsGraph'));

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
          <Suspense fallback={<div></div>}>
            <Routes>
              <Route path="/" element={isAuthenticated() ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <PublicRoute><Login /></PublicRoute>} />
              <Route path="*" element={isAuthenticated() ? <NotFound /> : <Navigate to="/admin/login" replace />} />
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
              <Route path="/sourcing_interest_graph" element={<ProtectedRoute><SourcingInterestsGraph /></ProtectedRoute>} />
              <Route path="/buyer-enquiries" element={<ProtectedRoute><Suspense fallback={<div></div>}><AdminBuyerEnquiries /></Suspense></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </div>
        {showLayout && <Footer />}
      </AlertProvider>
    </>
  );
}

export default AdminLayout;
