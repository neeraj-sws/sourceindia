import React, { useEffect, useMemo, useState } from 'react';
import { ROOT_URL } from "../config";
import { useSiteSettings } from "../context/SiteSettingsContext";

const HOME_POPUP_STORAGE_KEY = 'sourceindia_home_popup_banner';

const HomePopupBanner = () => {
  const { siteSettings, loading } = useSiteSettings();
  const [isVisible, setIsVisible] = useState(false);

  const popupConfig = useMemo(() => {
    const homeSettings = siteSettings?.home_settings || {};
    return {
      image: homeSettings.popup_banner_file || '',
      url: (homeSettings.popup_banner_url || '').trim(),
      status: String(homeSettings.popup_banner_status || '0') === '1',
      sessionId: homeSettings.popup_banner_session_id || ''
    };
  }, [siteSettings]);

  useEffect(() => {
    if (loading) return;

    if (!popupConfig.status || !popupConfig.image) {
      setIsVisible(false);
      return;
    }

    try {
      const raw = localStorage.getItem(HOME_POPUP_STORAGE_KEY);
      if (!raw) {
        setIsVisible(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const storedSessionId = parsed?.sessionId || '';
      const isClicked = Boolean(parsed?.clicked);

      if (storedSessionId && popupConfig.sessionId && storedSessionId !== popupConfig.sessionId) {
        localStorage.removeItem(HOME_POPUP_STORAGE_KEY);
        setIsVisible(true);
        return;
      }

      if (isClicked && storedSessionId === popupConfig.sessionId) {
        setIsVisible(false);
        return;
      }

      setIsVisible(true);
    } catch (error) {
      localStorage.removeItem(HOME_POPUP_STORAGE_KEY);
      setIsVisible(true);
    }
  }, [loading, popupConfig]);

  const handleClose = () => {
    if (popupConfig.sessionId) {
      localStorage.setItem(HOME_POPUP_STORAGE_KEY, JSON.stringify({
        sessionId: popupConfig.sessionId,
        clicked: true,
        isCancled: true
      }));
    }
    setIsVisible(false);
  };

  const handleBannerClick = () => {
    if (popupConfig.sessionId) {
      localStorage.setItem(HOME_POPUP_STORAGE_KEY, JSON.stringify({
        sessionId: popupConfig.sessionId,
        clicked: true,
        isCancled: false
      }));
    }

    if (popupConfig.url) {
      window.location.href = popupConfig.url;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
      <div className="position-relative bg-white rounded shadow overflow-hidden" style={{ maxWidth: '520px', width: '90%' }}>
        <button
          type="button"
          className="border-0 position-absolute top-0 end-0 m-2 rounded-circle"
          aria-label="Close popup"
          onClick={handleClose}
        >
          <i className="bx bx-x fs-5"></i>
        </button>

        <button type="button" onClick={handleBannerClick} className="w-100 border-0 bg-transparent p-0">
          <img
            src={`${ROOT_URL}/${popupConfig.image}`}
            alt="Popup Banner"
            className="img-fluid w-100"
          />
        </button>
      </div>
    </div>
  );
};

export default HomePopupBanner;
