import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-GV1NBV98CK';

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
            if (!window.gtag) {
                return;
            }
            if (tracked) {
                return;
            }
            if (event?.detail?.path !== location.pathname) {
                return;
            }

            const pageTitle = event?.detail?.title || document.title;
            const pagePath = location.pathname;
            const pageLocation = window.location.href;

            window.gtag('event', 'page_view', {
                page_path: pagePath,
                page_title: pageTitle,
                page_location: pageLocation,
            });

            tracked = true;
        };

        window.addEventListener('seo:updated', onSeoUpdated);
        return () => window.removeEventListener('seo:updated', onSeoUpdated);
    }, [location.pathname]);

    return null;
};

export default AnalyticsTracker;