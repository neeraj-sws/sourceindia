import React from 'react'

const CompanyEdit = () => {
  return (
    <div className="page-wrapper">
        <div className="page-content">
            <h4 className="pb-2">Company Update</h4>
            <form
            action="https://sourceindia-electronics.com/dashboard-company-update"
            onsubmit="form_submit(this);return false;"
            method="POST"
            >
            <div className="card">
                <div className="card-body">
                <div className="row g-3">
                    <div className="row mt-3">
                    <div className="col-lg-12">
                        <div className="border border-1 p-4 rounded">
                        <div className="row g-3">
                            <div className="col-md-6">
                            <label className="form-label">
                                Organization Name<sup className="text-danger">*</sup>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="organization_name"
                                placeholder="Enter Organization Name"
                                defaultValue="FICUS PAX PRIVATE LIMTIED"
                            />
                            </div>
                            <div className="col-md-6 mt-3">
                            <label className="form-label">
                                Company Email<sup className="text-danger">*</sup>
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                name="company_email"
                                placeholder="Enter  Comapny Email"
                                defaultValue="VISHWANATH.S@FICUSPAX.COM"
                            />
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">
                                Company Location<sup className="text-danger">*</sup>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="company_location"
                                placeholder="Enter Organization Name"
                                defaultValue="Sy no 68/1,68/2, Part 120,121 and 123, Gokuldas warehousing co, Hosakote Chinthamaniroad,  Bheemakkanahalli, Hosakote Taluk, Bengaluru Rural, Karnataka,562122"
                            />
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">
                                Company Website <sup className="text-danger">*</sup>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="company_website"
                                placeholder="Enter Company Website"
                                defaultValue="VISHWANATH.S@FICUSPAX.COM"
                            />
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">
                                {" "}
                                Core Activities<sup className="text-danger">*</sup>
                            </label>
                            <select
                                className="form-select"
                                name="core_activity[]"
                                id="core_activity"
                                data-placeholder="Select Core Activities"
                                onchange="get_activity(this.value); return false;"
                            >
                                <option value="">Select Core Activities</option>
                                <option value={32} selected="">
                                Manufacturing
                                </option>
                                <option value={30}>Other</option>
                                <option value={31}>Services</option>
                            </select>
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">
                                Activity<sup className="text-danger">*</sup>
                            </label>
                            <select
                                className="form-control"
                                name="activity[]"
                                id="activity"
                                data-placeholder="Select Activity"
                            >
                                <option value="">Select activity</option>
                                <option value={24}>Assembly/ Sub-Assembly</option>
                                <option value={25}>Component</option>
                                <option value={27}>Design Services</option>
                                <option value={23}>EMS</option>
                                <option value={21} selected="">
                                Finished products
                                </option>
                                <option value={26}>Raw Material</option>
                            </select>
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">
                                Category<sup className="text-danger">*</sup>
                            </label>
                            <select
                                className="single-select-sell form-select select2-hidden-accessible"
                                name="category_sell[]"
                                id="category_sell"
                                data-placeholder="Select Category Sell"
                                multiple=""
                                onchange='get_sub_category(this,`["263",""]`); return false;'
                                data-select2-id="category_sell"
                                tabIndex={-1}
                                aria-hidden="true"
                            >
                                <option value="">Select categories</option>
                                <option value={31}>3D Printing &amp; DIY</option>
                                <option value={6}>Automotive Electronics</option>
                                <option value={32}>Cables &amp; Wire</option>
                                <option value={12}>Components</option>
                                <option value={33}>Connectors</option>
                                <option value={1}>Consumer Electronics</option>
                                <option value={34}>Discrete Semiconductors</option>
                                <option value={7}>Electric Vehicle</option>
                                <option value={24}>
                                Electro Mechanical Components
                                </option>
                                <option value={19}>
                                Electronic Manufacturing Services
                                </option>
                                <option value={36}>Hardware Components</option>
                                <option value={5}>Industrial Electronics</option>
                                <option value={37}>Integrated Circuit</option>
                                <option value={2}>IT/ Peripheral</option>
                                <option value={14} selected="" data-select2-id={2}>
                                Manufacturing Equipment / Tools
                                </option>
                                <option value={38}>
                                Measuring Instruments &amp; Tools
                                </option>
                                <option value={8}>Medical Equipments</option>
                                <option value={13}>Mobile Phone</option>
                                <option value={11}>Mobile Phone Accessory</option>
                                <option value={39}>Optoelectronics</option>
                                <option value={16} selected="" data-select2-id={3}>
                                Others
                                </option>
                                <option value={21} selected="" data-select2-id={4}>
                                Packaging Material for Electronics
                                </option>
                                <option value={40}>Passive Components</option>
                                <option value={41}>
                                Power Supply &amp; Management
                                </option>
                                <option value={28}>Printed Circuit Boards (PCB)</option>
                                <option value={29}>Raw Material</option>
                                <option value={10}>Security and Surveillance</option>
                                <option value={42}>Sensors</option>
                                <option value={9}>Solar</option>
                                <option value={4}>Strategic Electronics</option>
                                <option value={17}>Support Services</option>
                                <option value={3}>Telecom</option>
                                <option value={43}>Wireless Automation</option>
                            </select>
                            <span
                                className="select2 select2-container select2-container--bootstrap4"
                                dir="ltr"
                                data-select2-id={1}
                            >
                                <span className="selection">
                                <span
                                    className="select2-selection select2-selection--multiple"
                                    role="combobox"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    tabIndex={-1}
                                >
                                    <ul className="select2-selection__rendered">
                                    <span
                                        className="select2-selection__clear"
                                        data-select2-id={8}
                                    >
                                        ×
                                    </span>
                                    <li
                                        className="select2-selection__choice"
                                        title="Manufacturing Equipment / Tools"
                                        data-select2-id={5}
                                    >
                                        <span
                                        className="select2-selection__choice__remove"
                                        role="presentation"
                                        >
                                        ×
                                        </span>
                                        Manufacturing Equipment / Tools
                                    </li>
                                    <li
                                        className="select2-selection__choice"
                                        title="Others"
                                        data-select2-id={6}
                                    >
                                        <span
                                        className="select2-selection__choice__remove"
                                        role="presentation"
                                        >
                                        ×
                                        </span>
                                        Others
                                    </li>
                                    <li
                                        className="select2-selection__choice"
                                        title="Packaging Material for Electronics"
                                        data-select2-id={7}
                                    >
                                        <span
                                        className="select2-selection__choice__remove"
                                        role="presentation"
                                        >
                                        ×
                                        </span>
                                        Packaging Material for Electronics
                                    </li>
                                    <li className="select2-search select2-search--inline">
                                        <input
                                        className="select2-search__field"
                                        type="search"
                                        tabIndex={0}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                        role="textbox"
                                        aria-autocomplete="list"
                                        placeholder=""
                                        style={{ width: "0.75em" }}
                                        />
                                    </li>
                                    </ul>
                                </span>
                                </span>
                                <span className="dropdown-wrapper" aria-hidden="true" />
                            </span>
                            </div>
                            <div className="col-md-6">
                            <label className="form-label">Sub Category</label>
                            <select
                                className="single-select-sell form-select select2-hidden-accessible"
                                name="sub_category[]"
                                id="sub_category"
                                data-placeholder="Select Sub Segment"
                                multiple=""
                                data-select2-id="sub_category"
                                tabIndex={-1}
                                aria-hidden="true"
                            >
                                <option value={283}>Drill Bits/Router bits</option>
                                <option value={291}>Machinery for Manufacturing</option>
                                <option value={263} selected="" data-select2-id={10}>
                                Special Packaging for Components
                                </option>
                                <option value={296}>Test Equipment</option>
                            </select>
                            <span
                                className="select2 select2-container select2-container--bootstrap4"
                                dir="ltr"
                                data-select2-id={9}
                            >
                                <span className="selection">
                                <span
                                    className="select2-selection select2-selection--multiple"
                                    role="combobox"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    tabIndex={-1}
                                >
                                    <ul className="select2-selection__rendered">
                                    <span
                                        className="select2-selection__clear"
                                        data-select2-id={12}
                                    >
                                        ×
                                    </span>
                                    <li
                                        className="select2-selection__choice"
                                        title="Special Packaging for Components"
                                        data-select2-id={11}
                                    >
                                        <span
                                        className="select2-selection__choice__remove"
                                        role="presentation"
                                        >
                                        ×
                                        </span>
                                        Special Packaging for Components
                                    </li>
                                    <li className="select2-search select2-search--inline">
                                        <input
                                        className="select2-search__field"
                                        type="search"
                                        tabIndex={0}
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                        role="textbox"
                                        aria-autocomplete="list"
                                        placeholder=""
                                        style={{ width: "0.75em" }}
                                        />
                                    </li>
                                    </ul>
                                </span>
                                </span>
                                <span className="dropdown-wrapper" aria-hidden="true" />
                            </span>
                            </div>
                            <input
                            type="hidden"
                            name="max_cat_selection"
                            id="max_cat_selection"
                            defaultValue={5}
                            />
                            <input
                            type="hidden"
                            name="max_core_selection"
                            id="max_core_selection"
                            defaultValue={5}
                            />
                            <div className="col-md-12">
                            <label className="form-label">Company Logo </label>
                            <div className="input-group ">
                                <div className="col-md-9">
                                <div className="custom-file">
                                    <input
                                    type="hidden"
                                    name="logo_path"
                                    defaultValue="upload/user/"
                                    />
                                    <input
                                    type="hidden"
                                    name="logo_name"
                                    defaultValue="logo"
                                    />
                                    <input
                                    type="file"
                                    className="custom-file form-control"
                                    name="logo"
                                    onchange="upload_image_company($(form),'https://sourceindia-electronics.com/dashboard-image','logo','company_logo')"
                                    accept=".jpg,.jpeg,.png"
                                    />
                                    <input
                                    type="hidden"
                                    name="company_logo"
                                    id="company_logo"
                                    defaultValue={7605}
                                    />
                                    <i
                                    className="image_loader fa-btn-loader fa fa-refresh fa-spin fa-1x fa-fw"
                                    style={{ display: "none" }}
                                    />
                                </div>
                                </div>
                                <div className="col-md-3 text-center">
                                <a href="javascript:void(0);">
                                    <img
                                    src="https://sourceindia-electronics.com/upload/user/1758523927logo.webp"
                                    id="logo_prev"
                                    className="img-thumbnail play-video"
                                    alt=""
                                    width={100}
                                    style={{ height: 45, width: 180 }}
                                    />
                                </a>
                                <button
                                    type="button"
                                    className="btn  py-2 position-relative shadow-none"
                                    id="dtlogo"
                                    onclick="delete_logo()"
                                >
                                    <i
                                    className="fa fa-times crose position-absolute bg-primary text-white"
                                    aria-hidden="true"
                                    style={{
                                        bottom: 35,
                                        left: "-15px",
                                        padding: "2px 3px",
                                        borderRadius: "71%"
                                    }}
                                    />
                                </button>
                                </div>
                                <p className="mt-1">
                                Format (JPG/PNG) &amp; Maximum Size (10MB)
                                </p>
                            </div>
                            </div>
                            <div className="col-md-12">
                            <label className="form-label">
                                Company Introduction<sup className="text-danger">*</sup>
                            </label>
                            <textarea
                                className="form-control"
                                name="brief_company"
                                data-id="about"
                                placeholder="Company Introduction"
                                rows={10}
                                maxLength={1500}
                                defaultValue={
                                "We are a company with a pan-Indian presence providing complete packaging solutions to multinational and Indian companies.\n\nFicus Pax is an ISO 9001:2015 total packaging solutions provider to many MNCs in India and the Middle East. With more than 21 years of experience, we have offices and plants spread across the country. Our team of industry professionals consists of 30 design engineers, most of whom are alumni of the prestigious IIP (Indian Institute of Packaging). Our experienced packaging engineers and strong marketing team are supported by over 1000 skilled workers and staff. To our credit, we have more than 450 satisfied customers in India and the UAE.\nAs a company, we are committed to providing eco-friendly packaging material and sustainable packaging solutions to all our customers. We have a strong presence in the aerospace, automotive, pharmaceutical, telecom, energy and industrial equipment industries. Our clientele includes global leaders such as Schneider Electric, Volkswagen, General Motors, Tata Cummins Pvt Ltd, General Electric, Phillips, Siemens, Rolls-Royce, Tata Aerospace (Boeing, Airbus etc), Rane, JCB, JBM, LUK India, Luminous, and many others"
                                }
                            />
                            <p className="pt-3">
                                Total Words Limit <span className="about">1500 </span>{" "}
                            </p>
                            </div>
                            <div className="col-md-12 mt-3">
                            <label className="form-label">Ppt file</label>
                            <div className="input-group row">
                                <div className="col-md-10">
                                <div className="custom-file">
                                    <input
                                    type="hidden"
                                    name="sample_file_ppt_path"
                                    defaultValue="upload/seller/"
                                    />
                                    <input
                                    type="hidden"
                                    name="sample_file_ppt_name"
                                    defaultValue="sample_file_ppt"
                                    />
                                    <input
                                    type="file"
                                    className="custom-file form-control"
                                    name="sample_file_ppt"
                                    onchange="upload_sample_file_ppt($(form),'https://sourceindia-electronics.com/dashboard-image','sample_file_ppt','company_sample_ppt_file')"
                                    accept=".ppt,.pptx"
                                    />
                                    <input
                                    type="hidden"
                                    name="company_sample_ppt_file"
                                    id="company_sample_ppt_file"
                                    defaultValue=""
                                    />
                                    <i
                                    className="sample_file_ppt_loader fa-btn-loader fa fa-refresh fa-spin fa-1x fa-fw"
                                    style={{ display: "none" }}
                                    />
                                </div>
                                </div>
                                <div className="col-md-2 text-center">
                                <a
                                    id="sample_file_ppt_prev"
                                    href=""
                                    title="test"
                                    style={{ display: "none" }}
                                >
                                    <i className="fa fa-download" aria-hidden="true" />
                                </a>
                                </div>
                                <p className="mt-1">
                                Format (PPT/PPTX) &amp; Maximum Size (12MB)
                                </p>
                            </div>
                            </div>
                            <div className="col-md-12 mt-3 d-none">
                            <label className="form-label">Upload Video </label>
                            <div className="input-group row">
                                <div className="col-md-10">
                                <div className="custom-file">
                                    {/* <input type="url" class="form-control" name="company_video" value=""> */}
                                    <input
                                    type="hidden"
                                    name="video_path"
                                    defaultValue="upload/seller/video/"
                                    />
                                    <input
                                    type="hidden"
                                    name="video_name"
                                    defaultValue="video"
                                    />
                                    <input
                                    type="file"
                                    className="custom-file form-control"
                                    name="video"
                                    onchange="upload_video($(form),'https://sourceindia-electronics.com/dashboard-image','video','company_video')"
                                    accept="video/mp4,video/x-m4v,video/*"
                                    />
                                    <input
                                    type="hidden"
                                    name="company_video"
                                    id="company_video"
                                    defaultValue=""
                                    />
                                    <i
                                    className="video_loader fa-btn-loader fa fa-refresh fa-spin fa-1x fa-fw"
                                    style={{ display: "none" }}
                                    />
                                </div>
                                </div>
                                <div className="col-md-2 text-center"></div>
                                <p className="mt-1">Format MP4 Maximum Size (15MB)</p>
                                {/* <small>(https://www.youtube.com/c/w3schools)</small> */}
                            </div>
                            </div>
                            <div className="col-md-12 mt-3 ">
                            <label className="form-label">Upload Video Url</label>
                            <div className="input-group row">
                                <div className="col-md-10">
                                <div className="custom-file">
                                    <input
                                    type="url"
                                    className="form-control"
                                    name="company_video_second"
                                    defaultValue="https://WWW.FCUSPAX.COM"
                                    />
                                    <small>(https://www.youtube.com/c/w3schools)</small>
                                    {/* <input type="hidden" name="new_video_path"value="upload/seller/video/">   
                                <input type="hidden" name="new_video_name" value="new_video"> 
                                <input type="file" class="custom-file form-control" name="new_video" onchange="upload_video($(form),'https://sourceindia-electronics.com/dashboard-image','new_video','company_new_video')" accept="video/mp4,video/x-m4v,video/*">
                                <input type="hidden" name="company_new_video" id="company_new_video" value="https://WWW.FCUSPAX.COM">
                                <i class="new_video_loader fa-btn-loader fa fa-refresh fa-spin fa-1x fa-fw" style="display:none;"></i> */}
                                </div>
                                </div>
                                {/* <div class="col-md-2 text-center">
                                <//?php if($company_info->new_video){ ?>
                                <iframe src="https://sourceindia-electronics.com/" title="test">
                                </iframe>
                                <//?php } ?>
                            </div> */}
                            </div>
                            </div>
                            <div className="col-md-12">
                            <label className="form-label">Company Brochure</label>
                            <div className="input-group row">
                                <div className="col-md-10">
                                <div className="custom-file">
                                    <input
                                    type="hidden"
                                    name="sample_file_path"
                                    defaultValue="upload/seller/"
                                    />
                                    <input
                                    type="hidden"
                                    name="sample_file_name"
                                    defaultValue="sample_file"
                                    />
                                    <input
                                    type="file"
                                    className="custom-file form-control"
                                    name="sample_file"
                                    onchange="upload_sample_file($(form),'https://sourceindia-electronics.com/dashboard-image','sample_file','company_sample_file')"
                                    accept=".pdf"
                                    />
                                    <input
                                    type="hidden"
                                    name="company_sample_file"
                                    id="company_sample_file"
                                    defaultValue={7606}
                                    />
                                    <i
                                    className="image_loader fa-btn-loader fa fa-refresh fa-spin fa-1x fa-fw"
                                    style={{ display: "none" }}
                                    />
                                </div>
                                </div>
                                <div className="col-md-2 text-center">
                                <a
                                    href="https://sourceindia-electronics.com/upload/seller/1758524061_PackagingBrochure.pdf"
                                    style={{ wordBreak: "break-all" }}
                                >
                                    1758524061_PackagingBrochure.pdf
                                </a>
                                </div>
                                <p className="mt-1">Format (PDF) Maximum Size (10MB)</p>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                    <div className="text-end">
                    <button type="submit" className="btn btn-primary mt-3">
                        Save{" "}
                        <i
                        className="st_loader spinner-border spinner-border-sm"
                        style={{ display: "none" }}
                        />
                    </button>
                    </div>
                </div>
                </div>
            </div>
            </form>
            {/*end row*/}
        </div>
        </div>
  )
}

export default CompanyEdit