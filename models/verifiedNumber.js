import mongoose from "mongoose";

const verifiedNumberSchema = new mongoose.Schema({
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["verified", "not_on_whatsapp"],
    required: true,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
});

const VerifiedNumberModel = mongoose.model(
  "VerifiedNumber",
  verifiedNumberSchema
);

export default VerifiedNumberModel;
