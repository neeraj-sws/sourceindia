import React from 'react';

const DEFAULT_SPECIFICATION_NAMES = ['Type', 'Brand', 'Material', 'Color', 'Size', 'Warranty', 'Country of Origin'];
const emptySpecification = () => ({ name: '', value: '', isCustom: false });

const OtherSpecifications = ({ specifications = [], onChange, error }) => {
  const rows = specifications.length ? specifications : [emptySpecification()];

  const updateRow = (index, changes) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));
  };

  const removeRow = (index) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    onChange(nextRows.length ? nextRows : [emptySpecification()]);
  };

  return (
    <div className="col-md-12">
      <div className="card border mt-2">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="mb-0">Other Specifications</h6>
              <small className="text-muted">Select a name or add a custom specification.</small>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onChange([...rows, emptySpecification()])}>
              <i className="bx bx-plus me-1" />Add Row
            </button>
          </div>

          {error ? <div className="text-danger small mb-2">{error}</div> : null}

          {rows.map((row, index) => {
            const isCustom = row.isCustom || (!DEFAULT_SPECIFICATION_NAMES.includes(row.name) && Boolean(row.name));
            const selectedName = isCustom ? '__custom__' : row.name;

            return (
              <div className="row g-2 align-items-start mb-2" key={`${index}-${row.name}`}>
                <div className={isCustom ? 'col-md-3' : 'col-md-5'}>
                  <select
                    className="form-select"
                    value={selectedName}
                    onChange={(event) => updateRow(index, event.target.value === '__custom__'
                      ? { name: '', isCustom: true }
                      : { name: event.target.value, isCustom: false })}
                  >
                    <option value="">Select specification</option>
                    {DEFAULT_SPECIFICATION_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                    <option value="__custom__">Custom specification</option>
                  </select>
                </div>

                {isCustom ? (
                  <div className="col-md-3">
                    <input type="text" className="form-control" placeholder="Specification name" value={row.name || ''}
                      onChange={(event) => updateRow(index, { name: event.target.value, isCustom: true })} />
                  </div>
                ) : null}

                <div className={isCustom ? 'col-md-5' : 'col-md-6'}>
                  <input type="text" className="form-control" placeholder="Specification value" value={row.value || ''}
                    onChange={(event) => updateRow(index, { value: event.target.value })} />
                </div>
                <div className="col-md-1 d-grid">
                  <button type="button" className="btn btn-outline-danger px-0 py-1" onClick={() => removeRow(index)} aria-label="Delete specification">
                    <i className="bx bx-trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OtherSpecifications;
