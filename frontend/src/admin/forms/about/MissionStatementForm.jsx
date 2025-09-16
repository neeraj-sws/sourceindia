import  React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const MissionStatementForm = () => {
  const { showNotification } = useAlert();
  const [missionFile, setMissionFile] = useState(null);
  const [missionIcon, setMissionIcon] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ mission_heading: '', mission_description: '', mission_file: '', mission_icon: '' });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
    
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/about`);
      setFormData(res.data);
    }
    fetchData();
  },[]);

  const handleMissionFileChange = (e) => { setMissionFile(e.target.files[0]) };

  const handleMissionIconChange = (e) => { setMissionIcon(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.mission_heading.trim()) errs.mission_heading = 'Heading is required';
    if (!formData.mission_description) errs.mission_description = 'Description is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (!missionFile && !formData.mission_file) {
      errs.mission_file = 'Logo image is required';
    } else if (missionFile) {
      if (!allowedImageTypes.includes(missionFile.type)) {
        errs.mission_file = 'Invalid image format (only JPG/PNG allowed)';
      } else if (missionFile.size > maxSize) {
        errs.mission_file = 'Image size must be under 2MB';
      }
    }
    if (!missionIcon && !formData.mission_icon) {
      errs.mission_icon = 'Icon image is required';
    } else if (missionIcon) {
      if (!allowedImageTypes.includes(missionIcon.type)) {
        errs.mission_icon = 'Invalid image format (only JPG/PNG allowed)';
      } else if (missionIcon.size > maxSize) {
        errs.mission_icon = 'Image size must be under 2MB';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (missionFile) data.append('mission_file', missionFile);
    if (missionIcon) data.append('mission_icon', missionIcon);
    try {
      await axios.put(`${API_BASE_URL}/settings/about`, data);
      showNotification("Mission statement form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving mission statement form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Mission Statement</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-12">
        <label htmlFor="mission_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.mission_heading ? 'is-invalid' : ''}`} id="mission_heading" placeholder="Heading" 
        value={formData.mission_heading} onChange={handleInputChange} />
        {errors.mission_heading && <div className="invalid-feedback">{errors.mission_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="mission_description" className="form-label required">Description</label>
        <textarea
          className={`form-control ${errors.mission_description ? 'is-invalid' : ''}`}
          id="mission_description"
          placeholder="Description"
          rows={3}
          onChange={handleInputChange}
          defaultValue={formData.mission_description}
        />
        {errors.mission_description && <div className="invalid-feedback">{errors.mission_description}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="mission_file" className="form-label required">Logo</label>
          <input className={`form-control ${errors.mission_file ? 'is-invalid' : ''}`} type="file" id="mission_file" onChange={handleMissionFileChange} />
          {errors.mission_file && <div className="invalid-feedback">{errors.mission_file}</div>}
          {missionFile ? (
            <img
              src={URL.createObjectURL(missionFile)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
            />
          ) : formData.mission_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.mission_file}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
      </div>
      <div className="col-md-6">
          <label htmlFor="mission_icon" className="form-label required">Icon</label>
          <input className={`form-control ${errors.mission_icon ? 'is-invalid' : ''}`} type="file" id="mission_icon" onChange={handleMissionIconChange} />
          {errors.mission_icon && <div className="invalid-feedback">{errors.mission_icon}</div>}
          {missionIcon ? (
            <img
              src={URL.createObjectURL(missionIcon)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
            />
          ) : formData.mission_icon ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.mission_icon}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default MissionStatementForm