import React from 'react';

const formatValue = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== '').join(', ');
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value && typeof value === 'object') return Object.values(value).filter(Boolean).join(', ');
  return String(value ?? '').trim();
};

const ProductSpecificationsTable = ({ dynamicFields = [], otherSpecifications = [] }) => {
  const dynamicRows = (Array.isArray(dynamicFields) ? dynamicFields : [])
    .filter((entry) => entry?.field?.label && entry.field.isActive !== false && entry.field.showOnDetail !== false)
    .map((entry) => ({
      id: `dynamic-${entry.id || entry.item_category_field_id}`,
      label: entry.field.label,
      value: formatValue(entry.value),
      order: Number(entry.field.displayOrder || 0),
    }))
    .filter((entry) => entry.value)
    .sort((first, second) => first.order - second.order);

  const otherRows = (Array.isArray(otherSpecifications) ? otherSpecifications : [])
    .map((entry, index) => ({
      id: `other-${entry.id || index}`,
      label: String(entry?.name || entry?.label || '').trim(),
      value: formatValue(entry?.value),
    }))
    .filter((entry) => entry.label && entry.value);

  const rows = [...dynamicRows, ...otherRows];
  if (!rows.length) return null;

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="card-header bg-white border-bottom py-3 px-3 px-md-4 d-flex align-items-center gap-2">
        <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 38, height: 38, background: '#fff1e8', color: '#ff6500' }}>
          <i className="bx bx-list-check fs-4" />
        </span>
        <div>
          <h5 className="mb-0">Product Specifications</h5>
          <small className="text-muted">Technical details and product information</small>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-3 ps-md-4 py-3" style={{ width: '35%' }}>Specification</th>
              <th className="py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {dynamicRows.length > 0 && dynamicRows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="ps-3 ps-md-4 fw-semibold text-secondary">
                  {row.label.charAt(0).toUpperCase() + row.label.slice(1)}
                </th>                <td className="text-break py-3">{row.value}</td>
              </tr>
            ))}
            {dynamicRows.length > 0 && otherRows.length > 0 && (
              <tr>
                <th colSpan="2" className="bg-light text-uppercase small fw-semibold ps-3 ps-md-4 py-3">Other Specifications</th>
              </tr>
            )}
            {otherRows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="ps-3 ps-md-4 fw-semibold text-secondary">{row.label}</th>
                <td className="text-break py-3">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSpecificationsTable;
