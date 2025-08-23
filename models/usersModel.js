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
    role: {
      type: String,
      required: true,
      default: 0, //1 for admin , 0 for normal users/clients
    },
    status: {
      type: String,
      required: true,
      default: 0, //0 for inactive users when payment is verified then admin can do it 1 means active
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
