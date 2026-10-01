const sequelize = require('../config/database');

const ASSIGNMENTS_TABLE = 'requirement_assignments';
const GENERATED_COLUMN = 'owned_requirement_id';
const UNIQUE_INDEX = 'uq_requirement_assignments_single_owner';

// Application code already prevents this, but the rule is important enough to
// enforce in the database too: a requirement may have AT MOST ONE accepted (3)
// or completed (6) assignment.
//
// A plain UNIQUE(requirement_id, seller_id) cannot express that - a seller who
// rejects and is re-offered the same requirement legitimately gets a second row.
// Instead a generated column carries the requirement id only while the row owns
// the lead, and a unique index on that column does the enforcing. Rows that do
// not own the lead hold NULL, and MySQL ignores NULLs in unique indexes, so
// arbitrarily many of them can coexist.
const GENERATED_DDL =
  `\`${GENERATED_COLUMN}\` INT GENERATED ALWAYS AS ` +
  `(CASE WHEN \`status\` IN (3, 6) THEN \`requirement_id\` ELSE NULL END) VIRTUAL`;

const OWNING_STATUSES = [3, 6];

async function getColumns(table) {
  const rows = await sequelize.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table',
    { replacements: { table }, type: sequelize.QueryTypes.SELECT }
  );
  return new Set(rows.map((r) => String(r.COLUMN_NAME || r.column_name).toLowerCase()));
}

async function getIndexes(table) {
  const rows = await sequelize.query(
    'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table',
    { replacements: { table }, type: sequelize.QueryTypes.SELECT }
  );
  return new Set(rows.map((r) => String(r.INDEX_NAME || r.index_name).toLowerCase()));
}

// Legacy data can predate the ownership lock, so a requirement may currently
// have several accepted/completed rows. Keep exactly one owner per requirement -
// a completion always outranks a bare acceptance, earliest wins on a tie - and
// demote the rest to rejected. Nothing is deleted, so the history stays intact.
async function repairDuplicateOwners() {
  const duplicates = await sequelize.query(
    `SELECT requirement_id, COUNT(*) AS owner_count
       FROM ${ASSIGNMENTS_TABLE}
      WHERE status IN (:statuses)
      GROUP BY requirement_id
     HAVING COUNT(*) > 1`,
    { replacements: { statuses: OWNING_STATUSES }, type: sequelize.QueryTypes.SELECT }
  );

  if (duplicates.length === 0) return { requirements: 0, demoted: 0 };

  let demoted = 0;
  for (const { requirement_id: requirementId } of duplicates) {
    const owners = await sequelize.query(
      `SELECT assignment_id, seller_id, status, accepted_at, completed_at, assigned_at
         FROM ${ASSIGNMENTS_TABLE}
        WHERE requirement_id = :id AND status IN (:statuses)`,
      { replacements: { id: requirementId, statuses: OWNING_STATUSES }, type: sequelize.QueryTypes.SELECT }
    );

    owners.sort((a, b) => {
      const rank = (r) => (Number(r.status) === 6 ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const ta = new Date(a.completed_at || a.accepted_at || a.assigned_at || 0).getTime() || 0;
      const tb = new Date(b.completed_at || b.accepted_at || b.assigned_at || 0).getTime() || 0;
      if (ta !== tb) return ta - tb;
      return Number(a.assignment_id) - Number(b.assignment_id);
    });

    const losers = owners.slice(1);
    if (losers.length === 0) continue;

    await sequelize.query(
      `UPDATE ${ASSIGNMENTS_TABLE}
          SET status = 4,
              rejected_at = NOW(),
              reassignment_reason = 'superseded_by_owner',
              auto_cancelled_at = NULL
        WHERE assignment_id IN (:ids)`,
      { replacements: { ids: losers.map((l) => l.assignment_id) } }
    );
    demoted += losers.length;
  }

  return { requirements: duplicates.length, demoted };
}

// Idempotent, runs on every boot alongside the other schema ensures. Never
// throws: a failure here must not stop the API from starting.
async function ensureRequirementAssignmentOwnership() {
  const result = { columnAdded: false, indexAdded: false, repaired: null };
  try {
    const columns = await getColumns(ASSIGNMENTS_TABLE);
    if (columns.size === 0) {
      console.log('ensureRequirementAssignmentOwnership: requirement_assignments table not present, skipping');
      return result;
    }

    if (!columns.has(GENERATED_COLUMN)) {
      await sequelize.query(`ALTER TABLE ${ASSIGNMENTS_TABLE} ADD COLUMN ${GENERATED_DDL}`);
      result.columnAdded = true;
    }

    const indexes = await getIndexes(ASSIGNMENTS_TABLE);
    if (!indexes.has(UNIQUE_INDEX)) {
      try {
        await sequelize.query(
          `ALTER TABLE ${ASSIGNMENTS_TABLE} ADD UNIQUE INDEX ${UNIQUE_INDEX} (${GENERATED_COLUMN})`
        );
        result.indexAdded = true;
      } catch (err) {
        // Almost certainly pre-existing duplicate owners. Repair, then retry once.
        console.warn(`ensureRequirementAssignmentOwnership: ${err.message} - repairing duplicate owners`);
        result.repaired = await repairDuplicateOwners();
        console.log(
          `ensureRequirementAssignmentOwnership: demoted ${result.repaired.demoted} duplicate owner row(s) ` +
          `across ${result.repaired.requirements} requirement(s)`
        );
        try {
          await sequelize.query(
            `ALTER TABLE ${ASSIGNMENTS_TABLE} ADD UNIQUE INDEX ${UNIQUE_INDEX} (${GENERATED_COLUMN})`
          );
          result.indexAdded = true;
        } catch (retryErr) {
          console.error('ensureRequirementAssignmentOwnership: could not add unique index:', retryErr.message);
        }
      }
    }
  } catch (err) {
    console.error('ensureRequirementAssignmentOwnership: failed:', err.message);
  }
  return result;
}

module.exports = {
  ASSIGNMENTS_TABLE,
  GENERATED_COLUMN,
  UNIQUE_INDEX,
  OWNING_STATUSES,
  ensureRequirementAssignmentOwnership,
  repairDuplicateOwners,
};
