"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAiTemplateText } from "./components/aiTemplateI18n";
import { FloatingTools } from "./components/FloatingTools";
import AITemplateStyles from "./components/AITemplateStyles";

async function persistGeneratedFile(
  image: string,
  name: string,
  category: "ai-template-generated",
) {
  try {
    let url = image;
    let publicId = "";

    if (image.startsWith("data:")) {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image }),
      });
      const upload = await uploadResponse.json().catch(() => null);
      if (!uploadResponse.ok || !upload?.success || !upload?.url) return;
      url = upload.url;
      publicId = upload.publicId || "";
    }

    await fetch("/api/my-files", {
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
  } catch (error) {
    console.error("Failed to save AI Template result to My Files:", error);
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
    setIsCropOpen(false);
    setUserPhotoPreview(null);
    setCropImage(null);
    setCropOriginalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedId]);

  useEffect(() => () => {
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
  }, []);

  const openTemplate = useCallback(
    (template: { id: number }) => setSelectedId(template.id),
    [],
  );
  const closeModal = useCallback(() => setSelectedId(null), []);

  const handleUserPhotoFile = useCallback((file: File) => {
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
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    const imageUrl = URL.createObjectURL(file);
    cropImageUrlRef.current = imageUrl;
    setCropOriginalFile(file);
    setCropImage(imageUrl);
    setIsCropOpen(true);
  }, []);

  const handleUserPhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) handleUserPhotoFile(file);
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

  const handleCropApplied = useCallback((blob: Blob) => {
    const croppedFile = new File([blob], "sohozkaj-cropped-photo.jpg", {
      type: "image/jpeg",
    });
    const previewUrl = URL.createObjectURL(blob);
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    cropImageUrlRef.current = null;
    if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
    userPhotoPreviewUrlRef.current = previewUrl;
    setUserPhoto(croppedFile);
    setUserPhotoPreview(previewUrl);
    setGenerationError("");
    setIsCropOpen(false);
    setCropImage(null);
    setCropOriginalFile(null);
  }, []);

  const handleUseOriginalPhoto = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    if (cropImageUrlRef.current) URL.revokeObjectURL(cropImageUrlRef.current);
    cropImageUrlRef.current = null;
    if (userPhotoPreviewUrlRef.current) URL.revokeObjectURL(userPhotoPreviewUrlRef.current);
    userPhotoPreviewUrlRef.current = previewUrl;
    setUserPhoto(file);
    setUserPhotoPreview(previewUrl);
    setGenerationError("");
    setIsCropOpen(false);
    setCropImage(null);
    setCropOriginalFile(null);
  }, []);

  const handleGeneratePhoto = useCallback(async () => {
    if (!selectedTemplate) return;
    if (!userPhoto) {
      setGenerationError("Please upload your photo first.");
      return;
    }

    generationAbortRef.current?.abort();
    const controller = new AbortController();
    generationAbortRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 180_000);

    setIsGenerating(true);
    setGenerationError("");
    setGeneratedImage(null);

    try {
      const formData = new FormData();
      formData.append("image", userPhoto, userPhoto.name);
      const templateImageForApi = selectedTemplate.image.startsWith("/")
        ? new URL(selectedTemplate.image, window.location.origin).toString()
        : selectedTemplate.image;
      formData.append("templateImage", templateImageForApi);
      const templatePrompt = [
        "Create a new image using the two attached images.",
        "",
        "IMAGE 1 is the AI template/reference image.",
        "IMAGE 2 is the user's own photo and is the identity source.",
        "",
        "Recreate the visual design of IMAGE 1 using the person from IMAGE 2.",
        "Preserve the user's identity and recognizable facial features.",
        "Do not copy or preserve the identity of the person shown in the template.",
        "Match the template's composition, pose, camera angle, framing, clothing style,",
        "background, lighting, shadows, color treatment, mood, depth, and overall visual style.",
        "Keep important graphic layout and design elements from the template when appropriate.",
        "Do not add extra people, random objects, logos, watermarks, or unrelated elements.",
        "Keep the result natural, photorealistic when the template is photorealistic,",
        "and faithful to the reference template's intended appearance.",
        "",
        `Template title: ${selectedTemplate.title}`,
        `Template category: ${selectedTemplate.category}`,
        `Template gender classification: ${selectedTemplate.gender}`,
        `Template image count classification: ${selectedTemplate.imageCount === 1 ? "1 image" : selectedTemplate.imageCount === 2 ? "2 images" : "3+ images"}`,
        `Template orientation: ${selectedTemplate.orientation}`,
        "",
        "Return only the finished generated image.",
      ].join("\n");
      formData.append("prompt", templatePrompt);

      const response = await fetch("/api/template-generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (response.status === 403 && data?.code === "SUBSCRIPTION_REQUIRED") {
        window.dispatchEvent(new Event("sohozkaj:subscription-required"));
      }
      if (!response.ok || !data?.success || !data.image)
        throw new Error(data?.error || "Template image generation failed.");
      if (generationAbortRef.current !== controller) return;
      setGeneratedImage(data.image);
      void persistGeneratedFile(
        data.image,
        `${selectedTemplate.title || "AI Template"} · ${new Date().toISOString().slice(0, 10)}`,
        "ai-template-generated",
      );
    } catch (error) {
      if (generationAbortRef.current !== controller) return;
      if (timedOut)
        setGenerationError(
          "Generation took too long. Please try again in a moment.",
        );
      else
        setGenerationError(
          error instanceof Error
            ? error.message
            : "Template image generation failed.",
        );
    } finally {
      window.clearTimeout(timeoutId);
      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
        setIsGenerating(false);
      }
    }
  }, [selectedTemplate, userPhoto]);

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
      className="ai-page"
      aria-hidden={isCropOpen}
      style={{ display: isCropOpen ? "none" : undefined }}
    >
      <DashboardNavbar />
      <SubscriptionLock />
      <main className="main-content">
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
