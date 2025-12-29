import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config';

const DEFAULT_SEO = {
  title: 'Source India',
  meta_title: 'sourceindia',
  meta_description: 'Find verified manufacturers and suppliers in India.',
  meta_keywords: '',
  meta_image: null,
};

const GlobalSeo = () => {
  const location = useLocation();
  const [seo, setSeo] = useState(DEFAULT_SEO);

  // 🔹 URL → SEO slug
  const getSeoSlug = (pathname) => {
    if (pathname === '/' || pathname === '') return 'home';
    return pathname.split('/').filter(Boolean)[0];
  };

  const isCompanyDetailPage = (pathname) =>
  pathname.startsWith('/companies/') && pathname.split('/').length === 3;

  const isProductDetailPage = (pathname) =>
  pathname.startsWith('/products/') && pathname.split('/').length === 3;

  const isTicketViewPage = (pathname) =>
  pathname.startsWith('/ticket/view/');

  useEffect(() => {
  const pathname = location.pathname;

  const fetchSeo = async () => {
    try {
      if (isTicketViewPage(pathname)) {
        setSeo({
          title: 'Support Ticket | Source India',
          meta_title: 'Support Ticket',
          meta_description: 'View and respond to your support ticket on Source India.',
          meta_keywords: '',
          meta_image: null,
        });
        return;
      }
        // 🔵 PRODUCT DETAIL PAGE
      if (isProductDetailPage(pathname)) {
        const productSlug = pathname.split('/')[2];

        const res = await axios.get(
          `${API_BASE_URL}/products/${productSlug}`
        );

        const product = res?.data || {};

        const keywords = product.recommended_companies
          ?.map((c) => c.organization_name)
          .join(',');

        setSeo({
          title: product.title || DEFAULT_SEO.title,
          meta_title: product.title || DEFAULT_SEO.meta_title,
          meta_description: product.short_description || DEFAULT_SEO.meta_description,
          meta_keywords: keywords || DEFAULT_SEO.meta_keywords,
          meta_image: product.file_name || DEFAULT_SEO.meta_image,
        });

        return;
      }
      // ✅ COMPANY DETAIL PAGE
      if (isCompanyDetailPage(pathname)) {
        const companySlug = pathname.split('/')[2];

        const res = await axios.get(
          `${API_BASE_URL}/products/companies/${companySlug}`
        );

        const company = res?.data || {};
        const productKeywords = company.products
          ?.map((p) => p.title)
          .join(',');

        setSeo({
          title: company.organization_name || DEFAULT_SEO.title,
          meta_title: company.organization_name || DEFAULT_SEO.meta_title,
          meta_description: company.brief_company || DEFAULT_SEO.meta_description,
          meta_keywords: productKeywords || DEFAULT_SEO.meta_keywords,
          meta_image: company.company_logo_file || DEFAULT_SEO.meta_image,
        });

        return;
      }

      // ✅ STATIC / CMS PAGES
      const slug = getSeoSlug(pathname);

      const res = await axios.get(
        `${API_BASE_URL}/seo_pages/slug/${slug}`
      );

      const data = res?.data || {};

      setSeo({
        title: data.title || DEFAULT_SEO.title,
        meta_title: data.meta_title || DEFAULT_SEO.meta_title,
        meta_description: data.meta_description || DEFAULT_SEO.meta_description,
        meta_keywords: data.meta_keywords || DEFAULT_SEO.meta_keywords,
        meta_image: data.meta_image || DEFAULT_SEO.meta_image,
      });
    } catch (error) {
      console.warn('SEO fallback to default', error);
      setSeo(DEFAULT_SEO);
    }
  };

  fetchSeo();
}, [location.pathname]);

  const imageUrl = seo.meta_image
    ? `${ROOT_URL}/${seo.meta_image}`
    : null;

  const currentUrl = window.location.href;

  return (
    <Helmet>
      {location.pathname.startsWith('/ticket/view') && (
      <meta name="robots" content="noindex,nofollow" />
    )}
      {/* Title */}
      <title>{seo.title}</title>

      {/* Meta */}
      <meta name="description" content={seo.meta_description} />
      {seo.meta_keywords && (
        <meta name="keywords" content={seo.meta_keywords} />
      )}
      <meta name="googlebot" content="index,follow" />

      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />
      <link rel="alternate" href={currentUrl} hreflang="en-in" />

      {/* Google / Schema */}
      <meta itemProp="name" content={seo.meta_title} />
      <meta itemProp="description" content={seo.meta_description} />
      {imageUrl && <meta itemProp="image" content={imageUrl} />}

      {/* Open Graph */}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.meta_title} />
      <meta property="og:description" content={seo.meta_description} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.meta_title} />
      <meta name="twitter:description" content={seo.meta_description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
    </Helmet>
  );
};

export default GlobalSeo;
