import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-YSQQDLNG4E';

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
        }

        // 🔥 Track page view on every route change
        if (window.gtag) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: location.pathname,
            });
        }

    }, [location]);

    return null;
};

export default AnalyticsTracker;