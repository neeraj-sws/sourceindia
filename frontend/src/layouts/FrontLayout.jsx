import { Outlet, Routes, Route, useLocation } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import '../assets/css/style.css';
const GlobalSeo = lazy(() => import('../utils/GlobalSeo'));
const FrontHeader = lazy(() => import('../common/FrontHeader'));
const FrontFooter = lazy(() => import('../common/FrontFooter'));
const UserHeader = lazy(() => import('../common/UserHeader'));
const UserSidebar = lazy(() => import('../common/UserSidebar'));
const UserFooter = lazy(() => import('../common/UserFooter'));
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Companies = lazy(() => import('../pages/Companies'));
const CompaniesFilter = lazy(() => import('../pages/CompaniesFilter'));
const Categories = lazy(() => import('../pages/Categories'));
const SubCategories = lazy(() => import('../pages/SubCategories'));
const ItemCategories = lazy(() => import('../pages/ItemCategories'));
const Items = lazy(() => import('../pages/Item'));
const ItemSubcategory = lazy(() => import('../pages/ItemSubcategory'));
const ProductsList = lazy(() => import('../pages/ProductsList'));
const KnowledgeCenter = lazy(() => import('../pages/KnowledgeCenter'));
const ContactUs = lazy(() => import('../pages/ContactUs'));
const GetSupport = lazy(() => import('../pages/GetSupport'));
const Registration = lazy(() => import('../pages/Registration'));
const Profile = lazy(() => import('../pages/Profile'));
const ProfileEdit = lazy(() => import('../pages/ProfileEdit'));
const CompanyEdit = lazy(() => import('../pages/CompanyEdit'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Isinterested = lazy(() => import('../pages/Isinterested'));
const MyProducts = lazy(() => import('../pages/MyProducts'));
const AddProduct = lazy(() => import('../pages/AddProduct'));
const LeadsList = lazy(() => import('../pages/LeadsList'));
const LeadDetail = lazy(() => import('../pages/LeadDetail'));
const OpenEnquiry = lazy(() => import('../pages/OpenEnquiry'));
const OpenEnquiryAll = lazy(() => import('../pages/OpenEnquiryAll'));
const OpenEnquiryDetails = lazy(() => import('../pages/OpenEnquiryDetails'));
const Inbox = lazy(() => import('../pages/Inbox'));
const CreateTicket = lazy(() => import('../pages/CreateTicket'));
const TrackTicket = lazy(() => import('../pages/TrackTicket'));
const ProductDetail = lazy(() => import('../pages/ProductsDetail'));
const CompanyDetail = lazy(() => import('../pages/CompanyDetail'));
const Enquiry = lazy(() => import('../pages/Enquiry'));
const TicketView = lazy(() => import('../pages/TicketView'));
const EnquiryList = lazy(() => import('../pages/EnquiryList'));
const MyAllEnquiryChat = lazy(() => import('../pages/MyAllEnquiryChat'));
const AllLeadsChat = lazy(() => import('../pages/AllLeadsChat'));
const TermsConditions = lazy(() => import('../pages/TermsConditions'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const Impersonate = lazy(() => import('../pages/Impersonate'));
const SubscriptionPlans = lazy(() => import('../pages/SubscriptionPlans'));
const MyBuyerEnquiries = lazy(() => import('../pages/MyBuyerEnquiries'));
const FAQPage = lazy(() => import('../pages/FAQPage'));
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from '../context/AlertContext';
import { AuthProvider } from '../context/AuthContext';

import PrivateRoute from '../routes/PrivateRoute';
import PublicRoute from '../routes/PublicRoute';


function FrontLayout() {
  const location = useLocation();
  const userLayoutPaths = ['/dashboard', '/profile', '/profile-edit', '/company-edit', '/my-product',
    '/add_product', '/edit_product', '/seller_enquiry', '/my_enquiry', '/open-enquiry-dashboard', '/open-enquiry',
    '/my-open-enquiry-dashboard', '/is-interested', '/lead-detail', '/my-all-enquiries-chats', '/all-leads-chats', 'open-enquiry-dashboard', '/my-buyer-enquiries'];
  const isUserLayout = userLayoutPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <AuthProvider>
        <AlertProvider>
          <GlobalSeo />
          <ToastContainer position="top-right" autoClose={2000} hideProgressBar={true} />
          <Suspense fallback={<div></div>}>
            {isUserLayout ? <><UserHeader /><UserSidebar /></> : <FrontHeader />}
          </Suspense>
          <main>
            <Suspense fallback={<div></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/registration" element={<Registration />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:slug" element={<CompanyDetail />} />
                <Route path="/company-list" element={<CompaniesFilter isSeller="1" />} />
                <Route path="/buyer-list" element={<CompaniesFilter isSeller="0" />} />
                <Route path="/trading-list" element={<CompaniesFilter isTrading="1" />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<SubCategories />} />
                <Route path="/categories/:category/:slug" element={<ItemCategories />} />
                <Route path="/items/:slug" element={<Items />} />
                <Route path="/categories/:category/:subcategory/:slug" element={<ItemSubcategory />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/knowledge-center" element={<KnowledgeCenter />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/get-support" element={<GetSupport />} />
                <Route path="/get-support/createticket" element={<CreateTicket />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/profile-edit" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />
                <Route path="/company-edit" element={<PrivateRoute><CompanyEdit /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/is-interested" element={<PrivateRoute><Isinterested /></PrivateRoute>} />
                <Route path="/my-product" element={<PrivateRoute><MyProducts /></PrivateRoute>} />
                <Route path="/add_product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
                <Route path="/edit_product/:productId" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
                <Route path="/seller_enquiry" element={<PrivateRoute><LeadsList /></PrivateRoute>} />
                <Route path="/my_enquiry" element={<PrivateRoute><EnquiryList /></PrivateRoute>} />
                <Route path="/all-leads-chats" element={<PrivateRoute><AllLeadsChat /></PrivateRoute>} />
                <Route path="/my-all-enquiries-chats" element={<PrivateRoute><MyAllEnquiryChat /></PrivateRoute>} />
                <Route path="/lead-detail/:enquiry_number" element={<PrivateRoute><LeadDetail /></PrivateRoute>} />
                <Route path="/my-open-enquiry-dashboard" element={<PrivateRoute><OpenEnquiry /></PrivateRoute>} />
                <Route path="/open-enquiry-dashboard" element={<PrivateRoute><OpenEnquiryAll showAll={true} /></PrivateRoute>} />
                <Route path="/open-enquiry/:OpenEnquiryId" element={<PrivateRoute><OpenEnquiryDetails /></PrivateRoute>} />

                <Route path="/get-support/trackticket" element={<TrackTicket />} />
                <Route path="/enquiry" element={<Enquiry />} />
                <Route path="/ticket/view/:number" element={<TicketView />} />
                <Route path="/terms_conditions" element={<TermsConditions />} />
                <Route path="/privacy_policy" element={<PrivacyPolicy />} />
                <Route path="/impersonate" element={<Impersonate />} />
                <Route path="/plans" element={<SubscriptionPlans />} />
                <Route path="/my-buyer-enquiries" element={<PrivateRoute><MyBuyerEnquiries /></PrivateRoute>} />
                <Route path="/faq" element={<FAQPage />} />
              </Routes>
            </Suspense>
          </main>
          {isUserLayout ? <UserFooter /> : <FrontFooter />}
        </AlertProvider>
      </AuthProvider>
    </>
  );
}

export default FrontLayout;
