const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"],
      default: "CUSTOMER",
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Which organization this user belongs to
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    // Which branch this user is assigned to
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
  },
  { timestamps: true }
);

const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

module.exports = UserModel;