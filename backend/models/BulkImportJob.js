const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Accessors should tolerate Sequelize's partial instances (for example static
// update calls) and leave corrupt JSON for the controller's explicit reader
// to report when it actually needs the job data.
const normalizeJsonValue = (value) => {
  if (value === null || value === undefined || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const BulkImportJob = sequelize.define('BulkImportJob', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  adminUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_user_id',
  },
  level: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name',
  },
  fileHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'file_hash',
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'validated',
  },
  counts: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      return normalizeJsonValue(this.getDataValue('counts'));
    },
    set(value) {
      this.setDataValue('counts', normalizeJsonValue(value));
    },
  },
  validatedRows: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'validated_rows',
    get() {
      return normalizeJsonValue(this.getDataValue('validatedRows'));
    },
    set(value) {
      this.setDataValue('validatedRows', normalizeJsonValue(value));
    },
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
}, {
  tableName: 'bulk_import_jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['file_hash', 'level', 'status'], name: 'idx_bulk_import_job_hash' },
    { fields: ['expires_at'], name: 'idx_bulk_import_job_expires' },
  ],
});

module.exports = BulkImportJob;
