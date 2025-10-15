import "../css/home.css";

const FrontHeader = () => {
  return (
    <header className='mainHeader'>
      <div className='container'>
        <div className="top-bar px-3 d-flex justify-content-between align-items-center">
          <div className="welcomeBox d-flex">
            <div>Welcome User!</div>
            <div className="text-center text-md-start d-none d-md-block">
              <span className="ms-3">Support: +91-11-41615985</span>
            </div>
          </div>
          <div className="middleBox">
            <form className="d-flex align-items-center flex-grow-1">
              <div className="search-bar d-flex w-100">
                <select className="form-select w-auto px-3">
                  <option value="product">Product</option>
                  <option value="company">Company</option>
                </select>
                <input type="text" className="form-control" placeholder="Search.." />
                <button className="btn search-btn" type="submit">Search</button>
              </div>
            </form>
          </div>
          <div className="lastbox">
            <div className="d-flex align-items-center gap-2">
              <a href="javascript:void(0);" className="thLink text-center me-2"><i className="lni lni-question-circle d-block"></i>
                Support</a>
              <a href="javascript:void(0);" className="btn btn-sm btnType1">Sign In</a>
              <a href="javascript:void(0);" className="btn btn-sm btn-primary">Join Free</a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white py-3">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <a href="javascript:void(0);" className="d-flex align-items-center text-decoration-none">
                <img src="/logo.png" alt="Logo" height="40" className="me-2" />
              </a>
            </div>
            <div className="centerMenu">
              <nav className="navbar navbar-expand-lg">
                <div className="">
                  <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="javascript:void(0);mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                  </button>

                  <div className="collapse navbar-collapse" id="mainNavbar">
                    <ul className="navbar-nav ms-auto">
                      <li className="nav-item">
                        <a className="nav-link active" href="javascript:void(0);">Home</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="javascript:void(0);">Product Categories</a>
                      </li>
                      <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle" href="javascript:void(0);" id="companyDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                          Companies
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="companyDropdown">
                          <li><a className="dropdown-item" href="javascript:void(0);">Company 1</a></li>
                          <li><a className="dropdown-item" href="javascript:void(0);">Company 2</a></li>
                          <li><a className="dropdown-item" href="javascript:void(0);">Company 3</a></li>
                        </ul>
                      </li>

                      <li className="nav-item">
                        <a className="nav-link" href="javascript:void(0);">Registration</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="javascript:void(0);">Event</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" href="javascript:void(0);">Enquiry</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </nav>
            </div>
            <div>
              <a className="post-btn">ELCINA Website</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default FrontHeader