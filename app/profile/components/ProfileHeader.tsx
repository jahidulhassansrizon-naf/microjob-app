"use client";
import { T, useProfileText } from "./profileI18n";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
type UserProfile = {
    fullName?: string;
    profileImageUrl?: string;
    profileImagePublicId?: string;
};
function getInitials(name?: string) {
    if (!name?.trim())
        return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
export default function ProfileHeader({ user, onUserUpdated, }: {
    user: UserProfile | null;
    onUserUpdated?: (user: UserProfile) => void;
}) {
    const { t } = useProfileText();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(user?.profileImageUrl || "");
    const [uploadError, setUploadError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    useEffect(() => {
        setPreviewUrl(user?.profileImageUrl || "");
    }, [user?.profileImageUrl]);
    const openFilePicker = () => {
        if (!uploading && !deleting)
            fileInputRef.current?.click();
    };
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Allow selecting the same image again after a failed/successful upload.
        event.target.value = "";
        if (!file)
            return;
        setUploadError("");
        setDeleteError("");
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ]);
        if (!allowedTypes.has(file.type)) {
            setUploadError("JPG, PNG, WebP or GIF image select.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Profile image must be 5 MB or smaller.");
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/user/profile-image", {
                method: "POST",
                headers: {
                    ...getClientAuthHeaders(),
                },
                credentials: "include",
                body: formData,
                cache: "no-store",
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.replace("/login");
                return;
            }
            if (!response.ok || !data?.success || !data?.user) {
                throw new Error(data?.message || data?.error || "Profile photo upload failed.");
            }
            const updatedUser = data.user as UserProfile;
            setPreviewUrl(updatedUser.profileImageUrl || data.imageUrl || objectUrl);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(new CustomEvent("sohozkaj:user-updated", {
                detail: updatedUser,
            }));
            onUserUpdated?.(updatedUser);
        }
        catch (error) {
            setPreviewUrl(user?.profileImageUrl || "");
            setUploadError(error instanceof Error
                ? error.message
                : "Profile photo upload failed. Please try again.");
        }
        finally {
            URL.revokeObjectURL(objectUrl);
            setUploading(false);
        }
    };
    const handleDeletePhoto = async () => {
        if (!previewUrl || uploading || deleting)
            return;
        const shouldDelete = window.confirm(t("Are you sure you want to delete your profile photo?"));
        if (!shouldDelete)
            return;
        setUploadError("");
        setDeleteError("");
        setDeleting(true);
        try {
            const response = await fetch("/api/user/profile-image", {
                method: "DELETE",
                headers: {
                    ...getClientAuthHeaders(),
                },
                credentials: "include",
                cache: "no-store",
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.replace("/login");
                return;
            }
            if (!response.ok || !data?.success || !data?.user) {
                throw new Error(data?.message || data?.error || "Profile photo delete failed.");
            }
            const updatedUser = data.user as UserProfile;
            setPreviewUrl("");
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(new CustomEvent("sohozkaj:user-updated", {
                detail: updatedUser,
            }));
            onUserUpdated?.(updatedUser);
        }
        catch (error) {
            setDeleteError(error instanceof Error
                ? error.message
                : "Profile photo delete failed. Please try again.");
        }
        finally {
            setDeleting(false);
        }
    };
    const busy = uploading || deleting;
    return (<section className="bg-[#FBF6E8] rounded-3xl border border-[#E3D6B8]/80 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className="relative">
          <button type="button" onClick={openFilePicker} disabled={busy} className="group relative block h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full bg-[#FEE9E9] text-[#DC2626] ring-1 ring-inset ring-[#DC2626]/20 outline-none cursor-pointer focus-visible:ring-4 focus-visible:ring-[#DC2626]/20 disabled:cursor-wait" aria-label={t("Change profile photo")}>
            {previewUrl ? (<img src={previewUrl} alt={`${user?.fullName || t("User")} ${t("profile photo")}`} className="h-full w-full object-cover"/>) : (<span className="flex h-full w-full items-center justify-center text-3xl sm:text-4xl font-extrabold tracking-tight">
                {getInitials(user?.fullName)}
              </span>)}

            <span className="absolute inset-0 flex items-center justify-center bg-[#3B2F1E]/45 opacity-0 transition-opacity group-hover:opacity-100">
              {busy ? (<Loader2 size={24} className="animate-spin text-white"/>) : (<Camera size={24} className="text-white"/>)}
            </span>
          </button>

          <button type="button" onClick={openFilePicker} disabled={busy} className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#E3D6B8] bg-[#DC2626] text-white shadow-md transition hover:bg-[#B91C1C] disabled:cursor-wait disabled:opacity-70" aria-label={t("Upload or change profile photo")} title={t("Upload or change photo")}>
            {uploading ? (<Loader2 size={15} className="animate-spin"/>) : (<Camera size={15}/>)}
          </button>

          {previewUrl && (<button type="button" onClick={handleDeletePhoto} disabled={busy} className="absolute bottom-0 left-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#E3D6B8] bg-[#FBF6E8] text-[#DC2626] shadow-md transition hover:bg-[#FEE9E9] disabled:cursor-wait disabled:opacity-70" aria-label={t("Delete profile photo")} title={t("Delete profile photo")}>
              {deleting ? (<Loader2 size={15} className="animate-spin"/>) : (<Trash2 size={15}/>)}
            </button>)}

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange}/>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#7A6A50] uppercase tracking-[0.16em]">
            <UserRound size={13}/><T>{"Profile\n          "}</T></div>

          <h2 className="mt-1 text-3xl sm:text-3xl font-bold text-[#3B2F1E]">
            {user?.fullName || <T>{"User Account"}</T>}
          </h2>

          <p className="mt-2 text-sm font-medium text-[#7A6A50]">
            {uploading
        ? <T>{"Uploading your photo to Cloudinary..."}</T> : deleting
        ? <T>{"Deleting your profile photo..."}</T>
        : previewUrl
            ? <T>{"Click your photo to change it, or use the red button to delete it."}</T>
            : <T>{"Click your photo to upload a profile picture."}</T>}
          </p>

          {uploadError && (<p className="mt-2 text-sm font-semibold text-red-600">
              {t(uploadError)}
            </p>)}

          {deleteError && (<p className="mt-2 text-sm font-semibold text-red-600">
              {t(deleteError)}
            </p>)}
        </div>
      </div>
    </section>);
}
