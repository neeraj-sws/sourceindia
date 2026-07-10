import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getGAMeasurementID = () => {
    const hostname = window.location.hostname;

    // react.sourceindia-electronics.com
    if (hostname.includes('react.sourceindia-electronics.com')) {
        return 'G-GV1NBV98CK';
    }

    // sourceindia-electronics.com (production)
    if (hostname.includes('sourceindia-electronics.com')) {
        return 'G-YSQQDLNG4E';
    }

    // Default for localhost
    return 'G-GV1NBV98CK';
};

const GA_MEASUREMENT_ID = getGAMeasurementID();

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Load script only once
        if (!window.gtagScriptLoaded) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);
            window.gtagScriptLoaded = true;

            // Initialize dataLayer & gtag
            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            window.gtag = gtag;

            window.gtag('js', new Date());
            window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
        }
    }, []);

    useEffect(() => {
        let tracked = false;

        const onSeoUpdated = (event) => {
            if (!window.gtag) return;
            if (tracked) return;
            if (event?.detail?.path !== location.pathname) return;

            tracked = true;
            window.gtag('event', 'page_view', {
                page_path: location.pathname,
                page_title: event?.detail?.title || document.title,
                page_location: window.location.href,
            });
        };

        window.addEventListener('seo:updated', onSeoUpdated);

        // Fallback: admin/user-layout pages par GlobalSeo nahi hota,
        // isliye seo:updated kabhi fire nahi hoti.
        // 3 second baad directly page_view bhejo.
        const fallbackTimer = setTimeout(() => {
            if (!tracked && window.gtag) {
                window.gtag('event', 'page_view', {
                    page_path: location.pathname,
                    page_title: document.title,
                    page_location: window.location.href,
                });
            }
        }, 3000);

        return () => {
            window.removeEventListener('seo:updated', onSeoUpdated);
            clearTimeout(fallbackTimer);
        };
    }, [location.pathname]);

    return null;
};

export default AnalyticsTracker;