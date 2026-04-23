import React, { useState, useEffect } from 'react';
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const PopupSectionForm = () => {
  const { showNotification } = useAlert();
  const [popupBannerFile, setPopupBannerFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    popup_banner_url: '',
    popup_banner_status: false,
    popup_banner_file: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, popup_banner_status: e.target.checked }));
  };

  const handlePopupBannerChange = (e) => {
    setPopupBannerFile(e.target.files[0] || null);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/home`);
      setFormData({
        popup_banner_url: res.data.popup_banner_url || '',
        popup_banner_status: String(res.data.popup_banner_status) === '1',
        popup_banner_file: res.data.popup_banner_file || ''
      });
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const errs = {};
    const url = formData.popup_banner_url.trim();
    const isStatusOn = Boolean(formData.popup_banner_status);

    if (isStatusOn && !url) {
      errs.popup_banner_url = 'Popup URL is required when popup is enabled';
    } else if (url && !/^https?:\/\/.+/i.test(url)) {
      errs.popup_banner_url = 'Enter a valid URL starting with http:// or https://';
    }

    if (isStatusOn && !popupBannerFile && !formData.popup_banner_file) {
      errs.popup_banner_file = 'Popup banner image is required when popup is enabled';
    }

    if (popupBannerFile) {
      const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      const maxSize = 2 * 1024 * 1024;
      if (!allowedImageTypes.includes(popupBannerFile.type)) {
        errs.popup_banner_file = 'Invalid image format';
      } else if (popupBannerFile.size > maxSize) {
        errs.popup_banner_file = 'Image must be under 2MB';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const data = new FormData();
    data.append('popup_banner_url', formData.popup_banner_url.trim());
    data.append('popup_banner_status', formData.popup_banner_status ? '1' : '0');
    if (popupBannerFile) {
      data.append('popup_banner_file', popupBannerFile);
    }

    try {
      await axios.put(`${API_BASE_URL}/settings/home`, data);
      showNotification("Popup section updated successfully!", "success");

      if (popupBannerFile) {
        const res = await axios.get(`${API_BASE_URL}/settings/home`);
        setFormData((prev) => ({
          ...prev,
          popup_banner_file: res.data.popup_banner_file || prev.popup_banner_file
        }));
      }
      setPopupBannerFile(null);
    } catch (error) {
      console.error('Error saving popup section form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">Pop-up Section</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-12">
          <label htmlFor="popup_banner_url" className="form-label">Popup Redirect URL</label>
          <input
            type="url"
            className={`form-control ${errors.popup_banner_url ? 'is-invalid' : ''}`}
            id="popup_banner_url"
            placeholder="https://example.com"
            value={formData.popup_banner_url}
            onChange={handleInputChange}
          />
          {errors.popup_banner_url && <div className="invalid-feedback">{errors.popup_banner_url}</div>}
        </div>

        <div className="col-md-12">
          <label className="form-label">Popup Banner Image</label>
          <input
            type="file"
            className={`form-control ${errors.popup_banner_file ? 'is-invalid' : ''}`}
            onChange={handlePopupBannerChange}
          />
          {errors.popup_banner_file && <div className="invalid-feedback">{errors.popup_banner_file}</div>}
          {popupBannerFile ? (
            <img src={URL.createObjectURL(popupBannerFile)} width={120} className="mt-2 rounded" />
          ) : formData.popup_banner_file ? (
            <div className="mt-2">
              <ImageWithFallback
                src={`${ROOT_URL}/${formData.popup_banner_file}`}
                width={120}
                showFallback={false}
              />
            </div>
          ) : null}
        </div>

        <div className="col-md-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="popup_banner_status"
              checked={formData.popup_banner_status}
              onChange={handleStatusChange}
            />
            <label className="form-check-label" htmlFor="popup_banner_status">
              Enable popup on homepage
            </label>
          </div>
        </div>

        <div className="col-12 text-end mt-4">
          <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default PopupSectionForm;
