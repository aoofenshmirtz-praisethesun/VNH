const mongoose = require('mongoose');

const MonthlyRecordSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  month: { type: String, required: true },
  mld_supplied: { type: Number, required: true },
  nrw_pct: { type: Number, required: true },
  tanker_count: { type: Number, required: true },
  supply_hrs_real: { type: String, default: "UNKNOWN" },
  uploaded_by: { type: String, default: "seed_script" },
  is_synthetic: { type: Boolean, default: true }
}, { timestamps: true });

MonthlyRecordSchema.index({ zone: 1, month: 1 });

module.exports = mongoose.model('MonthlyRecord', MonthlyRecordSchema);
