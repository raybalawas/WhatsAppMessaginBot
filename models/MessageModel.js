import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
    csvFilePath: {
      type: String,
      required: true,
    },
    anyDesignFile: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    numbersCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const messageModel = mongoose.model("Message", messageSchema);
export default messageModel;
