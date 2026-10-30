import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import { isConfiguredAdminEmail } from "@/lib/adminCredentials";
import { ensureUniqueFullNameIndex, findDuplicateFullName, normalizeFullName } from "@/app/api/_lib/userIdentity";
import { isValidEmail, NO_STORE_HEADERS } from "@/app/api/_lib/otpSecurity";

const ALLOWED_FIELDS = [
  "fullName",
  "phoneNumber",
  "email",
  "country",
  "district",
  "profession",
  "gender",
  "dob",
  "address",
  "thana",
  "postcode",
  "about",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

async function updateProfile(req: Request) {
  try {
    await connectDB();

    // Validate the signed token against the current database role and sessionVersion.
    // A demoted admin or a user with a revoked session cannot keep using an old token.
    const session = await getVerifiedRequestSession(req);
    if (!session) {
      return NextResponse.json({ message: "Invalid or expired session." }, { status: 401, headers: NO_STORE_HEADERS });
    }
    if (session.isRootAdmin) {
      return NextResponse.json({ message: "Main Admin profile details are managed through ADMIN_EMAIL and ADMIN_NAME in server environment settings." }, { status: 403, headers: NO_STORE_HEADERS });
    }
    // Read request body only after authentication.
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // 5. Only allow profile fields
    const updateData: Partial<Record<AllowedField, string>> = {};

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = typeof body[field] === "string" ? body[field].trim() : String(body[field]);
      }
    }

    if (updateData.fullName !== undefined) {
      updateData.fullName = updateData.fullName.normalize("NFKC").replace(/\s+/gu, " ").trim();
      if (!updateData.fullName || updateData.fullName.length > 100) {
        return NextResponse.json({ message: "Enter a valid name (up to 100 characters)." }, { status: 400, headers: NO_STORE_HEADERS });
      }
      await ensureUniqueFullNameIndex();
      const duplicateName = await findDuplicateFullName(updateData.fullName, session.userId);
      if (duplicateName) {
        return NextResponse.json({ message: "An account with this exact name already exists. Please change your name slightly." }, { status: 409, headers: NO_STORE_HEADERS });
      }
    }

    if (updateData.email !== undefined) {
      updateData.email = updateData.email.trim().toLowerCase();
      if (!isValidEmail(updateData.email)) {
        return NextResponse.json({ message: "Enter a valid email address." }, { status: 400, headers: NO_STORE_HEADERS });
      }
      if (isConfiguredAdminEmail(updateData.email)) {
        return NextResponse.json({ message: "This email is reserved for the Main Administrator." }, { status: 409, headers: NO_STORE_HEADERS });
      }
    }
    if (updateData.phoneNumber !== undefined && !/^\d{5,15}$/.test(updateData.phoneNumber)) {
      return NextResponse.json({ message: "Enter a valid phone number using digits only." }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // Uniqueness is checked server-side before mutation; MongoDB unique indexes
    // remain the final race-safe constraint for email and phone number.
    const identityChecks: Promise<unknown>[] = [];
    if (updateData.email !== undefined) {
      identityChecks.push(User.findOne({ email: updateData.email, _id: { $ne: session.userId } }).select("_id").lean().then((row) => {
        if (row) throw new Error("DUPLICATE_PROFILE_EMAIL");
      }));
    }
    if (updateData.phoneNumber !== undefined) {
      identityChecks.push(User.findOne({ phoneNumber: updateData.phoneNumber, _id: { $ne: session.userId } }).select("_id").lean().then((row) => {
        if (row) throw new Error("DUPLICATE_PROFILE_PHONE");
      }));
    }
    try {
      await Promise.all(identityChecks);
    } catch (error) {
      if (error instanceof Error && error.message === "DUPLICATE_PROFILE_EMAIL") {
        return NextResponse.json({ message: "This email is already registered to another account." }, { status: 409, headers: NO_STORE_HEADERS });
      }
      if (error instanceof Error && error.message === "DUPLICATE_PROFILE_PHONE") {
        return NextResponse.json({ message: "This phone number is already registered to another account." }, { status: 409, headers: NO_STORE_HEADERS });
      }
      throw error;
    }

    // 6. Check if there is anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No profile data provided!" },
        { status: 400 },
      );
    }

    // 7. Update user
    const dbUpdateData: Partial<Record<AllowedField | "fullNameNormalized", string>> = { ...updateData };
    if (updateData.fullName !== undefined) {
      dbUpdateData.fullNameNormalized = normalizeFullName(updateData.fullName);
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: dbUpdateData },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -fullNameNormalized");

    // 8. User not found
    if (!updatedUser) {
      return NextResponse.json({ message: "User not found!" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // 9. Success
    return NextResponse.json(
      {
        message: "Profile updated successfully!",
        user: updatedUser,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);

    // Duplicate email / phone error
    if (error?.code === 11000) {
      const duplicateField = String(Object.keys(error.keyPattern || error.keyValue || {})[0] || "").toLowerCase();
      const message = duplicateField.includes("fullname")
        ? "An account with this exact name already exists. Please change your name slightly."
        : duplicateField.includes("phone")
          ? "This phone number is already registered to another account."
          : "This email is already registered to another account.";
      return NextResponse.json({ message }, { status: 409, headers: NO_STORE_HEADERS });
    }

    if (error?.message === "DUPLICATE_PROFILE_EMAIL") {
      return NextResponse.json({ message: "This email is already registered to another account." }, { status: 409, headers: NO_STORE_HEADERS });
    }
    if (error?.message === "DUPLICATE_PROFILE_PHONE") {
      return NextResponse.json({ message: "This phone number is already registered to another account." }, { status: 409, headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      {
        message: "Unable to update your profile",
        error: error?.message || "Unknown error",
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PUT(req: Request) {
  return updateProfile(req);
}

export async function PATCH(req: Request) {
  return updateProfile(req);
}
