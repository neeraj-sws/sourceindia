import React, { useState, useEffect } from "react";
import { useAlert } from "../../context/AlertContext";
import Breadcrumb from "../common/Breadcrumb";
import API_BASE_URL from "../../config";
import axios from "axios";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const PageEdit = ({ pageId, title }) => {
  const { showNotification } = useAlert();
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/pages/${pageId}`);
        setFormData({
          title: res.data.title || "",
          description: res.data.description || "",
        });
      } catch {
        showNotification("Failed to load page.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [pageId]);

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    setFormData((prev) => ({ ...prev, [name || e.target?.id]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/pages/${pageId}`, formData);
      showNotification(`${title} updated successfully!`, "success");
    } catch {
      showNotification("Failed to update.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead={title} page="Settings" title={title} />
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Edit {title}</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  placeholder="Title"
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <CKEditor
                  editor={ClassicEditor}
                  data={formData.description}
                  onChange={(event, editor) =>
                    handleChange({ target: { name: "description", value: editor.getData() } })
                  }
                />
                {errors.description && <div className="text-danger small">{errors.description}</div>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Updating..." : "Update"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageEdit;
