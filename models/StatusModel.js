import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    generatedFile: {
      type: String,
    },
  },
  { timestamps: true }
);

const statusModel = mongoose.model("Status", statusSchema);
export default statusModel;
