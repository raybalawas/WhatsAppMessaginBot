import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      email: true,
      unique: true,
      required: true,
      lowercase: true,
    },
    mobile: {
      type: Number,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      min: 8,
      required: true,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
