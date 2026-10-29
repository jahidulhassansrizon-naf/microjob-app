import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import AIGeneration from "@/models/AIGeneration";
import PresenceSession from "@/models/PresenceSession";
import LiveScreenSignal from "@/models/LiveScreenSignal";
import QrUploadSession from "@/models/QrUploadSession";
import QuestionPaper from "@/models/QuestionPaper";
import SavedForm from "@/models/SavedForm";
import ScannedDocument from "@/models/ScannedDocument";
import Otp from "@/models/Otp";
import { ENV_ADMIN_USER_ID, isConfiguredAdminEmail } from "@/lib/adminCredentials";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

function invalidUserId() {
  return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
}

function publicIdFromCloudinaryUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !(url.hostname === "res.cloudinary.com" || url.hostname.endsWith(".res.cloudinary.com"))
    ) return "";

    const parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex < 0) return "";
    let assetParts = parts.slice(uploadIndex + 1);
    const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));
    if (versionIndex >= 0) {
      assetParts = assetParts.slice(versionIndex + 1);
    } else {
      while (assetParts.length > 0) {
        const first = assetParts[0];
        const looksLikeTransformation =
          first.includes(",") || first.includes(":") ||
          /(^|_)(w|h|c|g|q|f|e|ar|dpr|r|bo|b|fl)_/.test(first);
        if (!looksLikeTransformation) break;
        assetParts.shift();
      }
    }
    if (!assetParts.length) return "";
    const last = assetParts[assetParts.length - 1];
    const dotIndex = last.lastIndexOf(".");
    if (dotIndex > 0) assetParts[assetParts.length - 1] = last.slice(0, dotIndex);
    return assetParts.join("/");
  } catch {
    return "";
  }
}

/** Delete only Cloudinary assets explicitly linked to records owned by this user. */
async function deleteOwnedCloudinaryAssets(publicIds: string[]) {
  let pendingIds = [...new Set(publicIds.map((id) => id.trim()).filter(Boolean))];
  if (pendingIds.length === 0) return;

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  // Do not silently leave private files behind while reporting a complete delete.
  // Fail before deleting MongoDB records so the administrator can configure and retry.
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  // These user-facing tools store Cloudinary assets as image resources, while
  // some entries in the general file library may be video/raw resources. Try
  // each supported resource type and stop retrying an ID once it is deleted.
  for (const resourceType of ["image", "video", "raw"] as const) {
    const notFoundIds: string[] = [];

    for (let offset = 0; offset < pendingIds.length; offset += 100) {
      const batch = pendingIds.slice(offset, offset + 100);
      const result = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,
        type: "upload",
        invalidate: true,
      });
      const deleted = result?.deleted as Record<string, string> | undefined;
      if (!deleted) throw new Error("CLOUDINARY_DELETE_FAILED");

      for (const publicId of batch) {
        const status = String(deleted[publicId] || "").toLowerCase();
        if (status === "deleted") continue;
        if (status === "not_found" || status === "not found") {
          notFoundIds.push(publicId);
          continue;
        }
        throw new Error("CLOUDINARY_DELETE_FAILED");
      }
    }

    pendingIds = notFoundIds;
    if (pendingIds.length === 0) return;
  }

  // An asset that is not present under any supported resource type is already
  // absent; treating it as cleaned keeps account deletion safely idempotent.
}

/** Update account-level security settings. Password is never returned from GET/list APIs. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  if (!auth.admin) {
    return NextResponse.json({ success: false, message: "Could not verify administrator access." }, { status: 503 });
  }

  try {
    const { userId } = await context.params;
    if (!mongoose.isValidObjectId(userId)) return invalidUserId();
    if (userId === auth.admin.id || userId === ENV_ADMIN_USER_ID) {
      return NextResponse.json({ success: false, message: "You cannot change your own administrator account from this screen." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";
    const allowedActions = new Set(["ban", "unban", "grant-admin", "remove-admin", "reset-password"]);
    if (!allowedActions.has(action)) {
      return NextResponse.json({ success: false, message: "Unsupported account action." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const isDatabaseAdmin = user.role === "admin";
    if (isDatabaseAdmin && !auth.admin.isRootAdmin) {
      return NextResponse.json({ success: false, message: "Only the primary administrator can manage another administrator account." }, { status: 403 });
    }

    if (action === "grant-admin" || action === "remove-admin") {
      if (!auth.admin.isRootAdmin) {
        return NextResponse.json({ success: false, message: "Only the primary environment-configured administrator can change administrator roles." }, { status: 403 });
      }
      if (isConfiguredAdminEmail(user.email)) {
        return NextResponse.json({ success: false, message: "The primary environment-configured administrator cannot be changed here." }, { status: 403 });
      }

      if (action === "grant-admin") {
        // Atomic role update + version bump prevents concurrent security actions
        // from overwriting one another or leaving a just-issued session valid.
        const updated = await User.updateOne(
          { _id: user._id, role: user.role },
          {
            $set: {
              role: "admin",
              isBanned: false,
              bannedAt: null,
              bannedBy: "",
              banReason: "",
            },
            $inc: { sessionVersion: 1 },
          },
          { runValidators: true },
        );
        if (updated.modifiedCount !== 1) {
          return NextResponse.json({ success: false, message: "This account changed while you were managing it. Refresh the user list and try again." }, { status: 409 });
        }
        return NextResponse.json({ success: true, role: "admin", isBanned: false, message: `${user.fullName || user.email} now has administrator access. They must sign in again to enter the admin workspace.` });
      }

      if (!isDatabaseAdmin) {
        return NextResponse.json({ success: false, message: "This account is already a regular user." }, { status: 400 });
      }
      // Revoke all prior admin sessions immediately; old role claims cannot be
      // reused after this demotion. The role predicate prevents conflicting
      // concurrent role changes from silently overwriting each other.
      const updated = await User.updateOne(
        { _id: user._id, role: "admin" },
        {
          $set: {
            role: "user",
            isBanned: false,
            bannedAt: null,
            bannedBy: "",
            banReason: "",
          },
          $inc: { sessionVersion: 1 },
        },
        { runValidators: true },
      );
      if (updated.modifiedCount !== 1) {
        return NextResponse.json({ success: false, message: "This account changed while you were managing it. Refresh the user list and try again." }, { status: 409 });
      }
      return NextResponse.json({ success: true, role: "user", isBanned: false, message: `${user.fullName || user.email} is now a regular user. Their existing sessions were revoked and they must sign in again.` });
    }

    if (action === "ban" || action === "unban") {
      if (isDatabaseAdmin) {
        return NextResponse.json({ success: false, message: "Administrator accounts cannot be banned from tool access." }, { status: 403 });
      }
      if (action === "ban") {
        const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 240) : "";
        user.isBanned = true;
        user.bannedAt = new Date();
        user.bannedBy = auth.admin.email;
        user.banReason = reason;
      } else {
        user.isBanned = false;
        user.bannedAt = null;
        user.bannedBy = "";
        user.banReason = "";
      }
      await user.save();
      return NextResponse.json({
        success: true,
        isBanned: user.isBanned === true,
        bannedAt: user.bannedAt,
        banReason: user.banReason || "",
        message: action === "ban"
          ? `${user.fullName || user.email} can still log in, but all tool access is now blocked.`
          : `Tool access restored for ${user.fullName || user.email}.`,
      });
    }

    // Admin-generated passwords are random and stored only as a bcrypt hash.
    // The temporary password is returned once so the administrator can pass it to the user.
    if (action === "reset-password") {
      const temporaryPassword = randomBytes(15).toString("base64url");
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);
      const updated = await User.updateOne(
        { _id: user._id, password: user.password },
        {
          $set: { password: passwordHash, passwordChangedAt: new Date() },
          $inc: { sessionVersion: 1 },
        },
        { runValidators: true },
      );
      if (updated.modifiedCount !== 1) {
        return NextResponse.json({ success: false, message: "This account's credentials changed during the reset. Refresh the user details and try again." }, { status: 409 });
      }

      return NextResponse.json(
        {
          success: true,
          temporaryPassword,
          message: `Password reset for ${user.fullName || user.email}. Copy the temporary password now and share it securely. Existing sessions have been invalidated.`,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    return NextResponse.json({ success: false, message: "Unsupported account action." }, { status: 400 });
  } catch (error) {
    console.error("Admin user account action error:", error);
    return NextResponse.json({ success: false, message: "Could not update this account." }, { status: 500 });
  }
}

/** Permanently removes a user account and its private, user-owned database records. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  if (!auth.admin) {
    return NextResponse.json({ success: false, message: "Could not verify administrator access." }, { status: 503 });
  }

  try {
    const { userId } = await context.params;
    if (!mongoose.isValidObjectId(userId)) return invalidUserId();
    if (userId === auth.admin.id || userId === ENV_ADMIN_USER_ID) {
      return NextResponse.json({ success: false, message: "You cannot delete your own administrator account from this screen." }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(userId).select(
      "_id fullName email phoneNumber role profileImagePublicId profileImageUrl",
    );
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found. They may already have been deleted." }, { status: 404 });
    }
    if (user.role === "admin" || isConfiguredAdminEmail(user.email)) {
      return NextResponse.json({ success: false, message: "Administrator accounts must be demoted by the primary administrator before they can be deleted." }, { status: 403 });
    }

    const id = user._id;
    const idString = String(id);

    // Gather external asset IDs from records scoped to this user before cleanup.
    // Those assets are deleted before database records so a storage failure does
    // not produce a false success or remove the user's account prematurely.
    const [generations, scannedDocuments, userFiles] = await Promise.all([
      AIGeneration.find({ userId: id }).select("publicId url originalUrl").lean(),
      ScannedDocument.find({ userId: id }).select("publicId imageUrl").lean(),
      mongoose.connection
        .collection("userfiles")
        .find({ userId: id })
        .project({ publicId: 1, url: 1 })
        .toArray(),
    ]);
    const cloudinaryPublicIds = [
      user.profileImagePublicId || "",
      publicIdFromCloudinaryUrl(user.profileImageUrl),
      ...generations.flatMap((record: any) => [
        String(record.publicId || ""),
        publicIdFromCloudinaryUrl(record.url),
        // Only include original assets from this app's own Cloudinary folder.
        publicIdFromCloudinaryUrl(record.originalUrl).startsWith("sohozkaj-ai-photos/")
          ? publicIdFromCloudinaryUrl(record.originalUrl)
          : "",
      ]),
      ...scannedDocuments.flatMap((record: any) => [
        String(record.publicId || ""),
        publicIdFromCloudinaryUrl(record.imageUrl),
      ]),
      ...userFiles.flatMap((record: any) => [
        String(record.publicId || ""),
        publicIdFromCloudinaryUrl(record.url),
      ]),
    ];

    try {
      await deleteOwnedCloudinaryAssets(cloudinaryPublicIds);
    } catch (storageError) {
      console.error("Admin user cloud asset cleanup error:", storageError);
      return NextResponse.json(
        {
          success: false,
          message:
            storageError instanceof Error && storageError.message === "CLOUDINARY_NOT_CONFIGURED"
              ? "This account owns cloud files, but Cloudinary credentials are not configured. The account was not deleted; configure Cloudinary and retry."
              : "Could not remove all cloud files for this account. The account was not deleted; fix the storage issue and retry.",
        },
        { status: 502 },
      );
    }

    // Remove dependent records first. The account is removed last so a failed
    // cleanup does not intentionally leave a deleted login with private records.
    const presenceRows = await PresenceSession.find({ userId: id }).select("sessionId").lean();
    const sessionIds = presenceRows.map((row: any) => row.sessionId).filter(Boolean);
    const conversations = await ChatConversation.find({ userId: id }).select("_id").lean();
    const conversationIds = conversations.map((row: any) => row._id);

    await Subscription.deleteMany({ userId: id });
    await ChatMessage.deleteMany({
      $or: [
        { userId: id },
        ...(conversationIds.length ? [{ conversationId: { $in: conversationIds } }] : []),
      ],
    });
    await ChatConversation.deleteMany({ userId: id });
    await AIGeneration.deleteMany({ userId: id });
    await QrUploadSession.deleteMany({ userId: id });
    await QuestionPaper.deleteMany({ userId: id });
    await SavedForm.deleteMany({ userId: idString });
    await ScannedDocument.deleteMany({ userId: id });
    // my-files stores user-owned library metadata in an inline model collection.
    await mongoose.connection.collection("userfiles").deleteMany({ userId: id });
    await PresenceSession.deleteMany({ userId: id });
    await LiveScreenSignal.deleteMany({
      $or: [
        { viewerId: idString },
        ...(sessionIds.length ? [{ presenceSessionId: { $in: sessionIds } }] : []),
      ],
    });
    await Otp.deleteMany({
      identifier: {
        $in: [String(user.email || "").trim().toLowerCase(), String(user.phoneNumber || "").trim()].filter(Boolean),
      },
    });

    await User.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      message: `The account for ${user.fullName || user.email} and its associated database records were permanently deleted.`,
      deletedUserId: idString,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin permanent user deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Account deletion could not be completed. The account record was kept so cleanup can be retried; some associated records or files may already have been removed.",
      },
      { status: 500 },
    );
  }
}
