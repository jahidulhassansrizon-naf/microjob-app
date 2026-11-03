"use client";
import RetentionNotice from "@/app/_components/RetentionNotice";
import { useAiTemplateText } from "./aiTemplateI18n";
import React from "react";
import { X, ChevronLeft, ChevronRight, Download, Upload, Heart, Image as ImageIcon, Sparkles, QrCode } from "lucide-react";
import GenerationQuotaNotice from "@/app/_components/GenerationQuotaNotice";
import QrCodeSidebar from "@/app/ai-editor/_components/QrCodeSidebar";
import { GateOverlay } from "../../_components/GateOverlay";
import type { Template } from "./templateData";
const TEMPLATE_GATE_STAGES = [
    "Measuring your photo",
    "Detecting face and landmarks",
    "Matching the template style",
    "Keeping your own identity",
    "Refining the details",
];
type Props = {
    selectedTemplate: Template;
    generatedImage: string | null;
    isGenerating: boolean;
    userPhoto: File | null;
    userPhotoPreview: string | null;
    /** Couple templates (2 images): the second person's photo. */
    userPhoto2: File | null;
    userPhotoPreview2: string | null;
    fileInputRef2: React.RefObject<HTMLInputElement | null>;
    generationError: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isSelectedFavorite: boolean;
    onClose: () => void;
    onMove: (direction: 1 | -1) => void;
    onUserPhotoChange: (event: React.ChangeEvent<HTMLInputElement>, slot?: 1 | 2) => void;
    onUserPhotoFile: (file: File, slot?: 1 | 2) => void;
    onGeneratePhoto: () => void;
    onToggleFavorite: (id: number) => void;
};
export function TemplatePreviewModal({ selectedTemplate, generatedImage, isGenerating, userPhoto, userPhotoPreview, userPhoto2, userPhotoPreview2, fileInputRef2, generationError, fileInputRef, isSelectedFavorite, onClose, onMove, onUserPhotoChange, onUserPhotoFile, onGeneratePhoto, onToggleFavorite, }: Props) {
    const { t } = useAiTemplateText();
    // Which photo box (1 or 2) currently has its phone-upload QR open.
    const [phoneQrSlot, setPhoneQrSlot] = React.useState<1 | 2 | null>(null);
    const phoneQrSlotRef = React.useRef<1 | 2 | null>(null);
    phoneQrSlotRef.current = phoneQrSlot;
    const isCouple = selectedTemplate.imageCount === 2;
    const photoSlots = isCouple
      ? ([
          { slot: 1 as const, photo: userPhoto, preview: userPhotoPreview, inputRef: fileInputRef },
          { slot: 2 as const, photo: userPhoto2, preview: userPhotoPreview2, inputRef: fileInputRef2 },
        ])
      : ([{ slot: 1 as const, photo: userPhoto, preview: userPhotoPreview, inputRef: fileInputRef }]);
    const canGenerate = !!userPhoto && (!isCouple || !!userPhoto2);
    const imageBoxRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      // On phones the photo sits above the form, so keep it in view while the generating animation plays.
      if (!isGenerating || typeof window === "undefined") return;
      if (!window.matchMedia("(max-width: 820px)").matches) return;
      imageBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [isGenerating]);

    React.useEffect(() => {
      // A QR opened for one template must not remain attached after navigating to another template.
      setPhoneQrSlot(null);
    }, [selectedTemplate.id]);

    const handleQrPhotoReceived = React.useCallback((file: File) => {
      onUserPhotoFile(file, phoneQrSlotRef.current ?? 1);
      // Once a photo is accepted for this template, collapse the QR panel while it is cropped.
      setPhoneQrSlot(null);
    }, [onUserPhotoFile]);
    return (<div className="modal-backdrop" onClick={onClose}>
      <div className="template-modal" role="dialog" aria-modal="true" aria-label={t(selectedTemplate.title)} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("Close preview")}><X size={19}/></button>
        <button type="button" className="modal-nav modal-prev" onClick={() => onMove(-1)} aria-label={t("Previous template")}><ChevronLeft size={20}/></button>
        <button type="button" className="modal-nav modal-next" onClick={() => onMove(1)} aria-label={t("Next template")}><ChevronRight size={20}/></button>

        <div ref={imageBoxRef} className={`modal-image ${generatedImage ? "has-generated-image" : ""}`}>
          <img src={generatedImage || selectedTemplate.image} alt={generatedImage ? t(`Generated result for ${selectedTemplate.title}`) : t(selectedTemplate.title)} decoding="async" fetchPriority="high"/>

          {/* Same generating animation as the AI Editor. The photo on screen falls in, the new result rises out. */}
          <GateOverlay active={isGenerating} image={generatedImage || selectedTemplate.image} background="#E3D6B8" t={t} stages={TEMPLATE_GATE_STAGES}/>

          {generatedImage && (<div className="generated-image-overlay">
              <span className="generated-image-badge">{t("Generated")}</span>
              <a href={generatedImage} download={`sebalagbe-template-${selectedTemplate.id}.png`} className="generated-download-btn" aria-label={t("Download generated image")} title={t("Download generated image")}>
                <Download size={17}/><span>{t("Download")}</span>
              </a>
            </div>)}
        </div>

        <div className="modal-details scroll">
          {generatedImage && <RetentionNotice variant="compact" className="mb-3" locale="bn" />}
          <span className="modal-category">{t(selectedTemplate.category)}</span>
          <h2>{t(selectedTemplate.title)}</h2>
          <p className="modal-lead">{isCouple ? t("Upload a photo of each person and recreate this couple template while keeping both identities.") : t("Upload your photo and recreate this template while keeping your own identity.")}</p>

          {photoSlots.map(({ slot, photo, preview, inputRef }) => (<React.Fragment key={slot}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onUserPhotoChange(event, slot)} className="template-file-input" aria-label={isCouple ? t(`Person ${slot} photo`) : t("Upload your photo")}/>

            <div className={`template-upload-card ${photo ? "has-photo" : ""}`} style={slot === 2 ? { marginTop: 12 } : undefined}>
              <div className="template-upload-icon"><Upload size={18}/></div>
              <div className="template-upload-copy">
                <strong>{isCouple ? `${t(`Person ${slot} photo`)}${photo ? " ✓" : ""}` : photo ? t("Photo selected") : t("Upload your photo")}</strong>
                <span>{photo ? photo.name : isCouple ? t(`Add a clear photo of person ${slot}.`) : t("Add the photo you want to use for this template.")}</span>
              </div>

              {preview && (<div className="template-user-preview"><img src={preview} alt={t("Your uploaded photo")}/></div>)}

              <div className="template-upload-actions">
                <button type="button" className="template-upload-btn" onClick={() => inputRef.current?.click()} disabled={isGenerating}>
                  {photo ? t("Change Photo") : t("Choose Photo")}
                </button>
                <button
                  type="button"
                  className={`template-upload-qr-btn ${phoneQrSlot === slot ? "active" : ""}`}
                  onClick={() => setPhoneQrSlot((current) => (current === slot ? null : slot))}
                  disabled={isGenerating}
                  aria-expanded={phoneQrSlot === slot}
                >
                  <QrCode size={14} />
                  <span>{phoneQrSlot === slot ? t("Hide phone upload") : t("Upload from phone")}</span>
                </button>
              </div>
              <small>{t("JPG, PNG or WEBP • Max 15 MB")}</small>
            </div>

            {phoneQrSlot === slot && (
              <div className="template-qr-upload-panel">
                <p>{t("Scan the QR code to send a photo for this template.")}</p>
                <QrCodeSidebar onPhotoReceived={handleQrPhotoReceived} />
              </div>
            )}
          </React.Fragment>))}

          {generationError && <div className="template-generation-error" role="alert">{t(generationError)}</div>}

          <div className="template-how-it-works">
            <div className="template-how-step"><span>1</span><p>{t("Upload your photo")}</p></div>
            <div className="template-step-line"/>
            <div className="template-how-step"><span>2</span><p>{t("Generate your image")}</p></div>
          </div>

          <GenerationQuotaNotice locale="bn" />
          <button type="button" className="template-generate-btn" aria-label={t("Generate photo from this template")} onClick={onGeneratePhoto} disabled={!canGenerate || isGenerating}>
            <Sparkles size={17}/> {isGenerating ? t("Generating...") : t("Generate Photo")}
          </button>

          <button type="button" className={`template-favorite-btn ${isSelectedFavorite ? "active" : ""}`} onClick={() => onToggleFavorite(selectedTemplate.id)} aria-pressed={isSelectedFavorite}>
            <Heart size={15} fill={isSelectedFavorite ? "currentColor" : "none"}/>
            {isSelectedFavorite ? t("Saved to favorites") : t("Add to favorites")}
          </button>

          <div className="template-note"><ImageIcon size={14}/><span>{t("Use this template style with your own photo.")}</span></div>
        </div>
      </div>
    </div>);
}
