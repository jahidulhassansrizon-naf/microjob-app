import { Schema, models, model } from "mongoose";

const WithdrawalSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    note: { type: String, default: "", trim: true, maxlength: 300 },
    method: { type: String, default: "", trim: true, maxlength: 80 },
    // Where the money went: wallet/bank account number, holder name and the payment reference.
    accountNumber: { type: String, default: "", trim: true, maxlength: 60 },
    accountName: { type: String, default: "", trim: true, maxlength: 100 },
    transactionId: { type: String, default: "", trim: true, maxlength: 80 },
    // The date the money was actually taken out (admin can backdate an entry).
    withdrawnAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: String, default: "administrator" },
  },
  { timestamps: true },
);

const Withdrawal = models.Withdrawal || model("Withdrawal", WithdrawalSchema);

export default Withdrawal;
