import { Schema, model, models } from "mongoose";

/**
 * Main Admin (the ENV account) has no User document, so its "one device at a time"
 * session counter lives here. Every Main Admin login increments `sessionVersion`,
 * which invalidates the token of any other device.
 */
const AdminSessionStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "env-admin" },
    sessionVersion: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "admin_session_state" },
);

const AdminSessionState = models.AdminSessionState || model("AdminSessionState", AdminSessionStateSchema);
export default AdminSessionState;
