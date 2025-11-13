import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAlert } from "../../../context/AlertContext";
import API_BASE_URL from "../../../config";

const initialForm = { name: "", link: "", is_show: 1, status: 1, type: 1 };

const ChildMenuModal = ({ parentId, show, onClose }) => {
  const { showNotification } = useAlert();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState(initialForm);

  // Fetch child menus for specific parent
  const fetchMenus = async () => {
    if (!parentId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/front_menu?parent_id=${parentId}`);
      setMenus(response.data || []);
    } catch (err) {
      console.error(err);
      showNotification("Failed to fetch child menus", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchMenus();
  }, [show, parentId]);

  const handleSave = async (menu) => {
    if (!menu.name || !menu.link) {
      showNotification("Please fill all required fields", "warning");
      return;
    }

    try {
      if (menu.id) {
        await axios.put(`${API_BASE_URL}/front_menu/${menu.id}`, menu);
        showNotification("Child menu updated", "success");
      } else {
        await axios.post(`${API_BASE_URL}/front_menu`, { ...menu, parent_id: parentId });
        showNotification("Child menu added", "success");
        setNewRow(initialForm);
      }
      setEditingId(null);
      fetchMenus();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save child menu", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this child menu?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/front_menu/${id}`);
      showNotification("Child menu deleted", "success");
      fetchMenus();
    } catch (err) {
      console.error(err);
      showNotification("Failed to delete child menu", "error");
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Child Menus</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Link</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Show</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* New Row */}
                <tr>
                  <td>New</td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={newRow.name}
                      onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={newRow.link}
                      onChange={(e) => setNewRow({ ...newRow, link: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={newRow.type}
                      onChange={(e) => setNewRow({ ...newRow, type: parseInt(e.target.value) })}
                    >
                      <option value={1}>Header</option>
                      <option value={2}>Footer</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={newRow.status}
                      onChange={(e) => setNewRow({ ...newRow, status: parseInt(e.target.value) })}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={newRow.is_show}
                      onChange={(e) => setNewRow({ ...newRow, is_show: parseInt(e.target.value) })}
                    >
                      <option value={1}>Yes</option>
                      <option value={0}>No</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={() => handleSave(newRow)}>
                      <i className="bx bx-save pe-1"></i> Save
                    </button>
                  </td>
                </tr>

                {/* Existing Child Rows */}
                {menus.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No child menus. Add a new one above.
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
                              prev.map((m) => (m.id === menu.id ? { ...m, name: e.target.value } : m))
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
                              prev.map((m) => (m.id === menu.id ? { ...m, link: e.target.value } : m))
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
                              prev.map((m) => (m.id === menu.id ? { ...m, type: parseInt(e.target.value) } : m))
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
                              prev.map((m) => (m.id === menu.id ? { ...m, status: parseInt(e.target.value) } : m))
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
                              prev.map((m) => (m.id === menu.id ? { ...m, is_show: parseInt(e.target.value) } : m))
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
                        <>
                          <button className="btn btn-success btn-sm me-2" onClick={() => handleSave(menu)}>
                            <i className="bx bx-save pe-1"></i> Save
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                            <i className="bx bx-x"></i>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-primary btn-sm me-2" onClick={() => setEditingId(menu.id)}>
                            <i className="bx bx-edit"></i>
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(menu.id)}>
                            <i className="bx bx-trash"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center">
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
  );
};

export default ChildMenuModal;