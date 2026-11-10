"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildImageUploadRequest } from "@/lib/clientUpload";
import "react-image-crop/dist/ReactCrop.css";

import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";
import SubscriptionLock from "./components/SubscriptionLock";
import {
  filterTemplates,
  sortTemplates,
  TEMPLATES_BY_ID,
  getTemplateIdByImage,
  templates,
} from "./components/templateData";
import type {
  Gender,
  ImageCountFilter,
  OrientationFilter,
  ColorFilter,
  SortType,
} from "./components/templateData";
import { TemplateSidebar } from "./components/TemplateSidebar";
import { TemplateToolbar } from "./components/TemplateToolbar";
import { TemplateGrid } from "./components/TemplateGrid";
import { TemplatePreviewModal } from "./components/TemplatePreviewModal";
import { PhotoCropWorkspace } from "../_components/PhotoCropWorkspace";
import { buildCoupleTemplatePrompt, buildSingleTemplatePrompt } from "./templatePrompt";
import { useAiTemplateText } from "./components/aiTemplateI18n";
import { FloatingTools } from "./components/FloatingTools";
import AITemplateStyles from "./components/AITemplateStyles";
import RetentionNotice from "@/app/_components/RetentionNotice";
import { notifyMyFilesSaved } from "@/app/_lib/myFilesNotice";

// Same wording as the AI Editor page: never mention the AI provider to users.
const FRIENDLY_GENERATION_ERROR =
  "একটু অপেক্ষা করুন, ছবিটি তৈরি হতে সাধারণের চেয়ে বেশি সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";

async function persistGeneratedFile(
  image: string,
  name: string,
  category: "ai-template-generated",
): Promise<boolean> {
  try {
    let url = image;
    let publicId = "";

    if (image.startsWith("data:")) {
      const uploadRequest = buildImageUploadRequest(image);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: uploadRequest.headers,
        credentials: "include",
        body: uploadRequest.body,
      });
      const upload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok || !upload?.success || !upload?.url) return false;
      url = upload.url;
      publicId = upload.publicId || "";
    }

    const saveResponse = await fetch("/api/my-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        category,
        toolName: "AI Template",
        workspace: "creative",
        group: "image",
        url,
        publicId,
      }),
    });
    return saveResponse.ok;
  } catch (error) {
    console.error("Failed to save AI Template result to My Files:", error);
    return false;
  }
}

export default function AITemplatePage() {
  const { t } = useAiTemplateText();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState<Gender>("All");
  const [imageCount, setImageCount] = useState<ImageCountFilter>("All");
  const [orientation, setOrientation] = useState<OrientationFilter>("All");
  const [selectedColor, setSelectedColor] = useState<ColorFilter>("All");
  const [sortType, setSortType] = useState<SortType>("Newest");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropImageUrlRef = useRef<string | null>(null);
  const userPhotoPreviewUrlRef = useRef<string | null>(null);
  // Couple templates (2 images): the second person's photo.
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const userPhotoPreviewUrlRef2 = useRef<string | null>(null);
  const cropSlotRef = useRef<1 | 2>(1);
  const [userPhoto2, setUserPhoto2] = useState<File | null>(null);
  const [userPhotoPreview2, setUserPhotoPreview2] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropOriginalFile, setCropOriginalFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const generationAbortRef = useRef<AbortController | null>(null);

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    let mounted = true;

    void getClientSession().then((session) => {
      if (!mounted) return;

      const userId = session.user?.id || session.user?._id || null;
      setCurrentUserId(userId);

      if (!userId) {
        setFavorites([]);
        setFavoritesLoaded(true);
        return;
      }

      const storageKey = `sohozkaj-ai-template-favorites:${userId}`;

      try {
        const raw = window.localStorage.getItem(storageKey);
        const saved: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(saved)) {
          setFavorites(
            saved
              .map((url) =>
                typeof url === "string"
                  ? getTemplateIdByImage(url)
                  : undefined,
              )
              .filter((id): id is number => id !== undefined),
          );
        } else {
          setFavorites([]);
        }
      } catch {
        setFavorites([]);
      }

      // Never reuse the legacy global favorites key because it could belong to
      // another account on the same browser.
      try {
        window.localStorage.removeItem("sohozkaj-ai-template-favorites");
      } catch {
        // Ignore storage failures.
      }

      setFavoritesLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!favoritesLoaded || !currentUserId) return;

    try {
      const storageKey = `sohozkaj-ai-template-favorites:${currentUserId}`;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(
          favorites
            .map((id) => TEMPLATES_BY_ID.get(id)?.image)
            .filter((image): image is string => Boolean(image)),
        ),
      );
    } catch {
      // storage full or blocked: favorites just won't persist
    }
  }, [favorites, favoritesLoaded, currentUserId]);

  useEffect(() => () => generationAbortRef.current?.abort(), []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
    setGender("All");
    setImageCount("All");
    setOrientation("All");
    setSelectedColor("All");
    setSortType("Newest");
    setShowFavorites(false);
  }, []);

  const handleHashtagClick = useCallback(
    (tag: string) => setSearch(tag.replace(/^#+/, "")),
    [],
  );

  const filteredTemplates = useMemo(
    () =>
      sortTemplates(
        filterTemplates(
          templates,
          {
            search,
            category,
            gender,
            imageCount,
            orientation,
            color: selectedColor,
            favoritesOnly: showFavorites,
          },
          favoriteIds,
        ),
        sortType,
      ),
    [
      search,
      category,
      gender,
      imageCount,
      orientation,
      selectedColor,
      showFavorites,
      favoriteIds,
      sortType,
    ],
  );

  const selectedTemplate =
    selectedId === null ? null : (TEMPLATES_BY_ID.get(selectedId) ?? null);
  const isSelectedFavorite =
    selectedTemplate !== null && favoriteIds.has(selectedTemplate.id);

  useEffect(() => {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setIsGenerating(false);
    setGenerationError("");
    setGeneratedImage(null);
    setUserPhoto(null);
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    cropImageUrlRef.current = null;
    if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
    userPhotoPreviewUrlRef.current = null;
    if (userPhotoPreviewUrlRef2.current) URL.revokeObjectURL(userPhotoPreviewUrlRef2.current);
    userPhotoPreviewUrlRef2.current = null;
    cropSlotRef.current = 1;
    setUserPhoto2(null);
    setUserPhotoPreview2(null);
    if (fileInputRef2.current) fileInputRef2.current.value = "";
    setIsCropOpen(false);
    setUserPhotoPreview(null);
    setCropImage(null);
    setCropOriginalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedId]);

  useEffect(() => () => {
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
    if (userPhotoPreviewUrlRef2.current) URL.revokeObjectURL(userPhotoPreviewUrlRef2.current);
  }, []);

  const openTemplate = useCallback(
    (template: { id: number }) => setSelectedId(template.id),
    [],
  );
  const closeModal = useCallback(() => setSelectedId(null), []);

  const handleUserPhotoFile = useCallback((file: File, slot: 1 | 2 = 1) => {
    if (!file.type.toLowerCase().startsWith("image/")) {
      setGenerationError("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setGenerationError("The photo must be 15 MB or smaller.");
      return;
    }
    setGenerationError("");
    setGeneratedImage(null);
    cropSlotRef.current = slot;
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    const imageUrl = URL.createObjectURL(file);
    cropImageUrlRef.current = imageUrl;
    setCropOriginalFile(file);
    setCropImage(imageUrl);
    setIsCropOpen(true);
  }, []);

  const handleUserPhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 = 1) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) handleUserPhotoFile(file, slot);
    },
    [handleUserPhotoFile],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    cropImageUrlRef.current = null;
    setIsCropOpen(false);
    setCropImage(null);
    setCropOriginalFile(null);
  }, []);

  // Stores the chosen (cropped or original) photo in the slot that opened the crop screen.
  const storeUserPhoto = useCallback((file: File, previewUrl: string) => {
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    cropImageUrlRef.current = null;
    if (cropSlotRef.current === 2) {
      if (userPhotoPreviewUrlRef2.current) URL.revokeObjectURL(userPhotoPreviewUrlRef2.current);
      userPhotoPreviewUrlRef2.current = previewUrl;
      setUserPhoto2(file);
      setUserPhotoPreview2(previewUrl);
    } else {
      if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
      userPhotoPreviewUrlRef.current = previewUrl;
      setUserPhoto(file);
      setUserPhotoPreview(previewUrl);
    }
    setGenerationError("");
    setIsCropOpen(false);
    setCropImage(null);
    setCropOriginalFile(null);
  }, []);

  const handleCropApplied = useCallback((blob: Blob) => {
    const croppedFile = new File([blob], "sebalagbe-cropped-photo.jpg", {
      type: "image/jpeg",
    });
    storeUserPhoto(croppedFile, URL.createObjectURL(blob));
  }, [storeUserPhoto]);

  const handleUseOriginalPhoto = useCallback((file: File) => {
    storeUserPhoto(file, URL.createObjectURL(file));
  }, [storeUserPhoto]);

  const handleGeneratePhoto = useCallback(async () => {
    if (!selectedTemplate) return;
    const isCouple = selectedTemplate.imageCount === 2;
    if (!userPhoto) {
      setGenerationError(
        isCouple ? "Please upload both photos first." : "Please upload your photo first.",
      );
      return;
    }
    if (isCouple && !userPhoto2) {
      setGenerationError("Please upload both photos first.");
      return;
    }

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 300_000);

    setIsGenerating(true);
    setGenerationError("");
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append("image", userPhoto, userPhoto.name);
      if (isCouple && userPhoto2) {
        // Couple template: the second person's photo travels separately (image = person 1, image2 = person 2).
        formData.append("image2", userPhoto2, userPhoto2.name);
      }
      const templateImageForApi = selectedTemplate.image.startsWith("/")
        ? new URL(selectedTemplate.image, window.location.origin).toString()
        : selectedTemplate.image;
      formData.append("templateImage", templateImageForApi);
      const templatePrompt = isCouple
        ? buildCoupleTemplatePrompt(selectedTemplate)
        : buildSingleTemplatePrompt(selectedTemplate);
      formData.append("prompt", templatePrompt);

      const response = await fetch("/api/template-generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      window.dispatchEvent(new Event("sohozkaj:generation-finished"));
      if (response.status === 403 && data?.code === "SUBSCRIPTION_REQUIRED") {
        window.dispatchEvent(new Event("sohozkaj:subscription-required"));
        // The subscription dialog already explains the next step; no red error.
        if (generationAbortRef.current === controller) setGenerationError("");
        return;
      }
      if (!response.ok || !data?.success || !data.image) {
        // Never show raw server/bot text (it can mention Gemini, Playwright,
        // page URLs, button lists...). Show one friendly Bangla message instead.
        const rawMessage = typeof data?.error === "string" ? data.error : "";
        const looksTechnical =
          rawMessage.length > 300 ||
          /gemini|google|playwright|\[page:|signInVisible|buttons:|\bsession\b|\bbot\b|https?:\/\//i.test(rawMessage);
        throw new Error(
          !rawMessage || looksTechnical
            ? FRIENDLY_GENERATION_ERROR
            : rawMessage,
        );
      }
      if (generationAbortRef.current !== controller) return;
      setGeneratedImage(data.image);
      void persistGeneratedFile(
        data.image,
        `${selectedTemplate.title || "AI Template"} · ${new Date().toISOString().slice(0, 10)}`,
        "ai-template-generated",
      ).then((saved) => {
        // Tell the user where the image went, but only once it is really saved.
        if (saved) notifyMyFilesSaved();
      });
    } catch (error) {
      if (generationAbortRef.current !== controller) return;
      if (timedOut)
        setGenerationError(
          "Generation took too long. Please try again in a moment.",
        );
      else {
        console.error("Template generation error:", error);
        const raw = error instanceof Error ? error.message : "";
        // Network failures ("Failed to fetch") and any leaked technical text
        // are replaced by the same friendly message.
        const looksTechnical =
          !raw ||
          raw.length > 300 ||
          /gemini|google|playwright|failed to fetch|networkerror|\[page:|signInVisible|buttons:|\bsession\b|\bbot\b|https?:\/\//i.test(raw);
        setGenerationError(looksTechnical ? FRIENDLY_GENERATION_ERROR : raw);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
        setIsGenerating(false);
      }
    }
  }, [selectedTemplate, userPhoto, userPhoto2]);

  const moveSelected = useCallback(
    (direction: 1 | -1) => {
      if (selectedId === null || filteredTemplates.length === 0) return;
      const length = filteredTemplates.length;
      const currentIndex = filteredTemplates.findIndex(
        (item) => item.id === selectedId,
      );
      const nextIndex =
        currentIndex === -1
          ? direction === 1
            ? 0
            : length - 1
          : (currentIndex + direction + length) % length;
      setSelectedId(filteredTemplates[nextIndex].id);
    },
    [filteredTemplates, selectedId],
  );

  const isAnyModalOpen = selectedId !== null || isCropOpen;
  useEffect(() => {
    if (!isAnyModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isCropOpen) closeModal();
        return;
      }
      if (isCropOpen) return;
      if (event.key === "ArrowLeft") moveSelected(-1);
      else if (event.key === "ArrowRight") moveSelected(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAnyModalOpen, isCropOpen, closeModal, moveSelected]);

  return (
    <div
      className="ai-page page-font"
      aria-hidden={isCropOpen}
      style={{ display: isCropOpen ? "none" : undefined }}
    >
      <DashboardNavbar />
      <SubscriptionLock />
      <main className="main-content">
        <RetentionNotice variant="compact" className="mb-3" locale="bn" />
        <TemplateToolbar
          search={search}
          setSearch={setSearch}
          sortType={sortType}
          setSortType={setSortType}
          showFavorites={showFavorites}
          setShowFavorites={setShowFavorites}
          onHashtagClick={handleHashtagClick}
          filteredCount={filteredTemplates.length}
        />

        <div className="workspace">
          <TemplateSidebar
            category={category}
            setCategory={setCategory}
            gender={gender}
            setGender={setGender}
            imageCount={imageCount}
            setImageCount={setImageCount}
            orientation={orientation}
            setOrientation={setOrientation}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            sortType={sortType}
            setSortType={setSortType}
            resetFilters={resetFilters}
          />

          <section className="content-area">
            <TemplateGrid
              filteredTemplates={filteredTemplates}
              favoriteIds={favoriteIds}
              showFavorites={showFavorites}
              onToggleFavorite={toggleFavorite}
              onOpenTemplate={openTemplate}
              onResetFilters={resetFilters}
            />
          </section>
        </div>
      </main>

      <FloatingTools />

      {selectedTemplate && (
        <TemplatePreviewModal
          selectedTemplate={selectedTemplate}
          generatedImage={generatedImage}
          isGenerating={isGenerating}
          userPhoto={userPhoto}
          userPhotoPreview={userPhotoPreview}
          userPhoto2={userPhoto2}
          userPhotoPreview2={userPhotoPreview2}
          fileInputRef2={fileInputRef2}
          generationError={generationError}
          fileInputRef={fileInputRef}
          isSelectedFavorite={isSelectedFavorite}
          onClose={closeModal}
          onMove={moveSelected}
          onUserPhotoChange={handleUserPhotoChange}
          onUserPhotoFile={handleUserPhotoFile}
          onGeneratePhoto={handleGeneratePhoto}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {isCropOpen && cropImage && cropOriginalFile && (
        <PhotoCropWorkspace
          imageSrc={cropImage}
          originalFile={cropOriginalFile}
          onCancel={handleCropCancel}
          onApply={handleCropApplied}
          onUseOriginal={handleUseOriginalPhoto}
          translate={t}
        />
      )}

      <AITemplateStyles />
    </div>
  );
}

// git status
// git add .
// git commit -m "ja mon chaise tai korsi"
// git push origin main
