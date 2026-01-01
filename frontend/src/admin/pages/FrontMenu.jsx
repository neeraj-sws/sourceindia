import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
const initialForm = { name: "", link: "", is_show: 1, status: 1, type: 1, position: 1 };
import ChildMenuModal from "./modal/ChildMenuModal";

const FrontMenu = () => {
  const { showNotification } = useAlert();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState(initialForm);
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [menuCounts, setMenuCounts] = useState({
    headerCount: 0,
    footerCount: 0,
  });

  // Fetch menu counts
  const fetchMenuCounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/front_menu/count`);
      setMenuCounts(response.data);
    } catch (error) {
      console.error("Error fetching menu counts:", error);
    }
  };

  // Fetch shortcut menus
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/front_menu`);
      const normalized = response.data.map(m => ({
  ...m,
  type: Number(m.type),
  status: Number(m.status),
  is_show: Number(m.is_show),
  position: Number(m.position) || 1, // fallback to 1
}));

setMenus(normalized);
    } catch (error) {
      console.error("Error fetching menus:", error);
      showAlert("Failed to fetch shortcut menus", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchMenuCounts();
  }, []);

  const getAddPositionOptions = (type) => {
    const count = type === 1 ? menuCounts.headerCount : menuCounts.footerCount;
    return Array.from({ length: count + 1 }, (_, i) => i + 1);
  };

  // Position dropdown for EDIT MODE = original count only
  const getEditPositionOptions = (type) => {
    const count = type === 1 ? menuCounts.headerCount : menuCounts.footerCount;
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  // Save or Update Menu
  const handleSave = async (menu) => {
    try {
      if (!menu.name || !menu.link) {
        showNotification("Please fill all required fields", "warning");
        return;
      }

      if (menu.id) {
        await axios.put(`${API_BASE_URL}/front_menu/${menu.id}`, menu);
        showNotification("Menu updated successfully", "success");
      } else {
        await axios.post(`${API_BASE_URL}/front_menu`, menu);
        showNotification("Menu added successfully", "success");
        setNewRow(initialForm);
      }

      setEditingId(null);
      fetchMenus();
      fetchMenuCounts();
    } catch (error) {
      console.error("Error saving menu:", error);
      showNotification("Failed to save menu", "error");
    }
  };

  // Delete Menu
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/front_menu/${id}`);
      showNotification("Menu deleted successfully", "success");
      fetchMenus();
      fetchMenuCounts();
    } catch (error) {
      console.error("Error deleting menu:", error);
      showNotification("Failed to delete menu", "error");
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Front Menu" page="Settings" title="Front Menus" />

          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "70px" }}>ID</th>
                      <th>Name</th>
                      <th>Link</th>
                      <th style={{ width: "120px" }}>Type</th>
                      <th style={{ width: "120px" }}>Status</th>
                      <th style={{ width: "120px" }}>Show</th>
                      <th style={{ width: "120px" }}>Position</th>
                      <th style={{ width: "150px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add New Row */}
                    <tr>
                      <td>New</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter name"
                          value={newRow.name}
                          onChange={(e) =>
                            setNewRow({ ...newRow, name: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter link"
                          value={newRow.link}
                          onChange={(e) =>
                            setNewRow({ ...newRow, link: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={newRow.type}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              type: parseInt(e.target.value),
                            })
                          }
                        >
                          <option value={1}>Header</option>
                          <option value={2}>Footer</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={newRow.status}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              status: parseInt(e.target.value),
                            })
                          }
                        >
                          <option value={1}>Active</option>
                          <option value={0}>Inactive</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={newRow.is_show}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              is_show: parseInt(e.target.value),
                            })
                          }
                        >
                          <option value={1}>Yes</option>
                          <option value={0}>No</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={newRow.position}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              position: Number(e.target.value),
                            })
                          }
                        >
                          {getAddPositionOptions(newRow.type).map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleSave(newRow)}
                        >
                          <i className="bx bx-save pe-1"></i> Save
                        </button>
                      </td>
                    </tr>

                    {/* Existing Rows */}
                    {menus.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No records found
                        </td>
                      </tr>
                    )}

                    {menus.map((menu, index) => (
                      <tr key={menu.id}>
                        <td>{index + 1}</td>
                        <td>
                          {editingId === menu.id ? (
                            <input
                              type="text"
                              className="form-control"
                              value={menu.name}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) => m.id === menu.id ? { ...m, name: e.target.value } : m)
                                )
                              }
                            />
                          ) : (
                            menu.name
                          )}
                        </td>

                        <td>
                          {editingId === menu.id ? (
                            <input
                              type="text"
                              className="form-control"
                              value={menu.link}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) => m.id === menu.id ? { ...m, link: e.target.value } : m)
                                )
                              }
                            />
                          ) : (
                            menu.link
                          )}
                        </td>

                        <td>
                          {editingId === menu.id ? (
                            <select
                              className="form-select"
                              value={menu.type}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) => m.id === menu.id ? {...m, type: parseInt(e.target.value)} : m)
                                )
                              }
                            >
                              <option value={1}>Header</option>
                              <option value={2}>Footer</option>
                            </select>
                          ) : menu.type === 1 ? (
                            <span className="badge bg-success">Header</span>
                          ) : menu.type === 2 ? (
                            <span className="badge bg-danger">Footer</span>
                          ) : ""}
                        </td>
                        <td>
                          {editingId === menu.id ? (
                            <select
                              className="form-select"
                              value={menu.status}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) => m.id === menu.id ? {...m, status: parseInt(e.target.value)} : m)
                                )
                              }
                            >
                              <option value={1}>Active</option>
                              <option value={0}>Inactive</option>
                            </select>
                          ) : menu.status === 1 ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Inactive</span>
                          )}
                        </td>
                        <td>
                          {editingId === menu.id ? (
                            <select
                              className="form-select"
                              value={menu.is_show}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) => m.id === menu.id ? {...m, is_show: parseInt(e.target.value)} : m)
                                )
                              }
                            >
                              <option value={1}>Yes</option>
                              <option value={0}>No</option>
                            </select>
                          ) : menu.is_show === 1 ? (
                            <span className="badge bg-success">Yes</span>
                          ) : (
                            <span className="badge bg-danger">No</span>
                          )}
                        </td>

                        <td>
                          {editingId === menu.id ? (
                            <select
                              className="form-select"
                              value={menu.position}
                              onChange={(e) =>
                                setMenus((prev) =>
                                  prev.map((m) =>
                                    m.id === menu.id
                                      ? { ...m, position: Number(e.target.value) }
                                      : m
                                  )
                                )
                              }
                            >
                              {getEditPositionOptions(menu.type).map((pos) => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge bg-info">{menu.position}</span>
                          )}
                        </td>

                        <td>
                          {editingId === menu.id ? (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleSave(menu)}
                              >
                                <i className="bx bx-save"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingId(null)}
                              >
                                <i className="bx bx-x"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-secondary me-2 mb-1"
                                onClick={() => {
                                  setParentId(menu.id);
                                  setChildModalVisible(true);
                                }}
                              >
                                <i className="bx bx-plus"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-primary me-2 mb-1"
                                onClick={() => setEditingId(menu.id)}
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger mb-1"
                                onClick={() => handleDelete(menu.id)}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}

                    {loading && (
                      <tr>
                        <td colSpan="5" className="text-center">
                          Loading...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChildMenuModal 
        parentId={parentId}
        parentType={menus.find(m => m.id === parentId)?.type}
        show={childModalVisible} 
        onClose={() => setChildModalVisible(false)} 
      />
    </>
  );
};

export default FrontMenu;
