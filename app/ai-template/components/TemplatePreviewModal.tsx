"use client";
import { useAiTemplateText } from "./aiTemplateI18n";
import React from "react";
import { X, ChevronLeft, ChevronRight, Download, Upload, Heart, Image as ImageIcon, Sparkles, QrCode } from "lucide-react";
import QrCodeSidebar from "@/app/ai-editor/_components/QrCodeSidebar";
import { ScanOverlay } from "./ScanOverlay";
import type { Template } from "./templateData";
type Props = {
    selectedTemplate: Template;
    generatedImage: string | null;
    isGenerating: boolean;
    userPhoto: File | null;
    userPhotoPreview: string | null;
    generationError: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isSelectedFavorite: boolean;
    onClose: () => void;
    onMove: (direction: 1 | -1) => void;
    onUserPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onUserPhotoFile: (file: File) => void;
    onGeneratePhoto: () => void;
    onToggleFavorite: (id: number) => void;
};
export function TemplatePreviewModal({ selectedTemplate, generatedImage, isGenerating, userPhoto, userPhotoPreview, generationError, fileInputRef, isSelectedFavorite, onClose, onMove, onUserPhotoChange, onUserPhotoFile, onGeneratePhoto, onToggleFavorite, }: Props) {
    const { t } = useAiTemplateText();
    const [showPhoneQr, setShowPhoneQr] = React.useState(false);

    React.useEffect(() => {
      // A QR opened for one template must not remain attached after navigating to another template.
      setShowPhoneQr(false);
    }, [selectedTemplate.id]);

    const handleQrPhotoReceived = React.useCallback((file: File) => {
      onUserPhotoFile(file);
      // Once a photo is accepted for this template, collapse the QR panel while it is cropped.
      setShowPhoneQr(false);
    }, [onUserPhotoFile]);
    return (<div className="modal-backdrop" onClick={onClose}>
      <div className="template-modal" role="dialog" aria-modal="true" aria-label={t(selectedTemplate.title)} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t("Close preview")}><X size={19}/></button>
        <button type="button" className="modal-nav modal-prev" onClick={() => onMove(-1)} aria-label={t("Previous template")}><ChevronLeft size={20}/></button>
        <button type="button" className="modal-nav modal-next" onClick={() => onMove(1)} aria-label={t("Next template")}><ChevronRight size={20}/></button>

        <div className={`modal-image ${generatedImage ? "has-generated-image" : ""}`}>
          <img src={generatedImage || selectedTemplate.image} alt={generatedImage ? t(`Generated result for ${selectedTemplate.title}`) : t(selectedTemplate.title)} decoding="async" fetchPriority="high"/>

          {isGenerating && !generatedImage && (<ScanOverlay key="active-scan" active={isGenerating && !generatedImage}/>)}

          {generatedImage && (<div className="generated-image-overlay">
              <span className="generated-image-badge">{t("Generated")}</span>
              <a href={generatedImage} download={`sohozkaj-template-${selectedTemplate.id}.png`} className="generated-download-btn" aria-label={t("Download generated image")} title={t("Download generated image")}>
                <Download size={17}/><span>{t("Download")}</span>
              </a>
            </div>)}
        </div>

        <div className="modal-details scroll">
          <span className="modal-category">{t(selectedTemplate.category)}</span>
          <h2>{t(selectedTemplate.title)}</h2>
          <p className="modal-lead">{t("Upload your photo and recreate this template while keeping your own identity.")}</p>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUserPhotoChange} className="template-file-input" aria-label={t("Upload your photo")}/>

          <div className={`template-upload-card ${userPhoto ? "has-photo" : ""}`}>
            <div className="template-upload-icon"><Upload size={18}/></div>
            <div className="template-upload-copy">
              <strong>{userPhoto ? t("Photo selected") : t("Upload your photo")}</strong>
              <span>{userPhoto ? userPhoto.name : t("Add the photo you want to use for this template.")}</span>
            </div>

            {userPhotoPreview && (<div className="template-user-preview"><img src={userPhotoPreview} alt={t("Your uploaded photo")}/></div>)}

            <div className="template-upload-actions">
              <button type="button" className="template-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}>
                {userPhoto ? t("Change Photo") : t("Choose Photo")}
              </button>
              <button
                type="button"
                className={`template-upload-qr-btn ${showPhoneQr ? "active" : ""}`}
                onClick={() => setShowPhoneQr((current) => !current)}
                disabled={isGenerating}
                aria-expanded={showPhoneQr}
              >
                <QrCode size={14} />
                <span>{showPhoneQr ? t("Hide phone upload") : t("Upload from phone")}</span>
              </button>
            </div>
            <small>{t("JPG, PNG or WEBP • Max 15 MB")}</small>
          </div>

          {showPhoneQr && (
            <div className="template-qr-upload-panel">
              <p>{t("Scan the QR code to send a photo for this template.")}</p>
              <QrCodeSidebar onPhotoReceived={handleQrPhotoReceived} />
            </div>
          )}

          {generationError && <div className="template-generation-error" role="alert">{t(generationError)}</div>}

          <div className="template-how-it-works">
            <div className="template-how-step"><span>1</span><p>{t("Upload your photo")}</p></div>
            <div className="template-step-line"/>
            <div className="template-how-step"><span>2</span><p>{t("Generate your image")}</p></div>
          </div>

          <button type="button" className="template-generate-btn" aria-label={t("Generate photo from this template")} onClick={onGeneratePhoto} disabled={!userPhoto || isGenerating}>
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
