"use client";
import { T } from "@/components/i18n/I18nProvider";
import React from "react";
import { X, ChevronLeft, ChevronRight, Download, Upload, Heart, Image as ImageIcon, Sparkles } from "lucide-react";
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
    onGeneratePhoto: () => void;
    onToggleFavorite: (id: number) => void;
};
export function TemplatePreviewModal({ selectedTemplate, generatedImage, isGenerating, userPhoto, userPhotoPreview, generationError, fileInputRef, isSelectedFavorite, onClose, onMove, onUserPhotoChange, onGeneratePhoto, onToggleFavorite, }: Props) {
    return (<div className="modal-backdrop" onClick={onClose}>
      <div className="template-modal" role="dialog" aria-modal="true" aria-label={selectedTemplate.title} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close preview"><X size={19}/></button>
        <button type="button" className="modal-nav modal-prev" onClick={() => onMove(-1)} aria-label="Previous template"><ChevronLeft size={20}/></button>
        <button type="button" className="modal-nav modal-next" onClick={() => onMove(1)} aria-label="Next template"><ChevronRight size={20}/></button>

        <div className={`modal-image ${generatedImage ? "has-generated-image" : ""}`}>
          <img src={generatedImage || selectedTemplate.image} alt={generatedImage ? `Generated result for ${selectedTemplate.title}` : selectedTemplate.title} decoding="async" fetchPriority="high"/>

          {isGenerating && !generatedImage && (<ScanOverlay key="active-scan" active={isGenerating && !generatedImage}/>)}

          {generatedImage && (<div className="generated-image-overlay">
              <span className="generated-image-badge"><T>{"Generated"}</T></span>
              <a href={generatedImage} download={`sohozkaj-template-${selectedTemplate.id}.png`} className="generated-download-btn" aria-label="Download generated image" title="Download generated image">
                <Download size={17}/><span><T>{"Download"}</T></span>
              </a>
            </div>)}
        </div>

        <div className="modal-details">
          <span className="modal-category">{selectedTemplate.category}</span>
          <h2>{selectedTemplate.title}</h2>
          <p className="modal-lead"><T>{"Upload your photo and recreate this template while keeping your own identity."}</T></p>

          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onUserPhotoChange} className="template-file-input" aria-label="Upload your photo"/>

          <div className={`template-upload-card ${userPhoto ? "has-photo" : ""}`}>
            <div className="template-upload-icon"><Upload size={18}/></div>
            <div className="template-upload-copy">
              <strong>{userPhoto ? <T>{"Photo selected"}</T> : <T>{"Upload your photo"}</T>}</strong>
              <span>{userPhoto ? userPhoto.name : <T>{"Add the photo you want to use for this template."}</T>}</span>
            </div>

            {userPhotoPreview && (<div className="template-user-preview"><img src={userPhotoPreview} alt="Your uploaded photo"/></div>)}

            <button type="button" className="template-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={isGenerating}>
              {userPhoto ? <T>{"Change Photo"}</T> : <T>{"Choose Photo"}</T>}
            </button>
            <small><T>{"JPG, PNG or WEBP \u2022 Max 15 MB"}</T></small>
          </div>

          {generationError && <div className="template-generation-error" role="alert">{generationError}</div>}

          <div className="template-how-it-works">
            <div className="template-how-step"><span><T>{"1"}</T></span><p><T>{"Upload your photo"}</T></p></div>
            <div className="template-step-line"/>
            <div className="template-how-step"><span><T>{"2"}</T></span><p><T>{"Generate your image"}</T></p></div>
          </div>

          <button type="button" className="template-generate-btn" aria-label="Generate photo from this template" onClick={onGeneratePhoto} disabled={!userPhoto || isGenerating}>
            <Sparkles size={17}/> {isGenerating ? <T>{"Generating..."}</T> : <T>{"Generate Photo"}</T>}
          </button>

          <button type="button" className={`template-favorite-btn ${isSelectedFavorite ? "active" : ""}`} onClick={() => onToggleFavorite(selectedTemplate.id)} aria-pressed={isSelectedFavorite}>
            <Heart size={15} fill={isSelectedFavorite ? "currentColor" : "none"}/>
            {isSelectedFavorite ? <T>{"Saved to favorites"}</T> : <T>{"Add to favorites"}</T>}
          </button>

          <div className="template-note"><ImageIcon size={14}/><span><T>{"Use this template style with your own photo."}</T></span></div>
        </div>
      </div>
    </div>);
}
