const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const MembershipPlan = require('../models/MembershipPlan');

exports.getAllMembershipPlan = async (req, res) => {
  try {
    const { is_delete } = req.query;

    const whereCondition = {};
    if (is_delete !== undefined) {
      whereCondition.is_delete = is_delete;
    }

    const membershipPlans = await MembershipPlan.findAll({
      where: whereCondition,
      order: [['id', 'ASC']]
    });

    res.json(membershipPlans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
