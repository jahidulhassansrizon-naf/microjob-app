"use client";

export default function AITemplateStyles() {
  return (
    <style jsx global>{`
        .ai-page,
        .ai-page * {
          box-sizing: border-box;
        }

        .ai-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
        }

        /* Make every genuinely interactive control on this page feel clickable. */
        .ai-page button,
        .ai-page a,
        .ai-page [role="button"] {
          cursor: pointer;
        }

        .main-content {
          padding: 4px 16px 30px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -0.6px;
          color: #0f172a;
        }

        .page-header p {
          margin: 5px 0 0;
          font-size: 11px;
          color: #64748b;
        }

        .page-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .sort-pill {
          height: 30px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .sort-pill.selected {
          color: #fff;
          border-color: #2563eb;
          background: #2563eb;
        }

        .sort-pill.selected-light,
        .sort-pill.favorite-active {
          border-color: #2563eb;
          background: #eff6ff;
          color: #2563eb;
        }

        .workspace {
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr);
          gap: 13px;
          align-items: start;
        }

        .sidebar {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 12px 10px;
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 140px);
          overflow: auto;
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
        }

        .sidebar-heading button {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #94a3b8;
          font-size: 9px;
        }

        .filter-section-title {
          margin: 14px 0 7px;
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .category-list {
          max-height: 245px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .category-row {
          width: 100%;
          min-height: 28px;
          padding: 0 8px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #475569;
          font-size: 9px;
          text-align: left;
        }

        .category-row b {
          min-width: 22px;
          padding: 3px 5px;
          border-radius: 10px;
          background: #e2e8f0;
          color: #475569;
          font-size: 8px;
          text-align: center;
        }

        .category-row.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 900;
        }

        .category-row.active b {
          background: #2563eb;
          color: #fff;
        }

        .filter-group {
          margin-top: 5px;
        }

        .gender-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
        }

        .gender-card,
        .orientation-card {
          min-height: 50px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 700;
        }

        .gender-card.active,
        .orientation-card.active {
          color: #2563eb;
          border-color: #2563eb;
          background: #eff6ff;
        }

        .radio-list,
        .sort-side-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .radio-row,
        .sort-side-row {
          width: 100%;
          padding: 6px 7px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          color: #475569;
          font-size: 9px;
        }

        .radio-row.active,
        .sort-side-row.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .radio-row strong {
          display: block;
          font-size: 9px;
        }

        .radio-row small {
          display: block;
          margin-top: 1px;
          color: #94a3b8;
          font-size: 7px;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 50%;
          flex: none;
        }

        .radio-dot.checked {
          border-color: #2563eb;
          box-shadow: inset 0 0 0 3px #fff;
          background: #2563eb;
        }

        .orientation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .orientation-card {
          min-height: 55px;
        }

        .orientation-icon {
          display: block;
          border: 1.5px solid currentColor;
          border-radius: 2px;
        }

        .orientation-all {
          width: 14px;
          height: 14px;
        }

        .orientation-portrait {
          width: 10px;
          height: 14px;
        }

        .orientation-landscape {
          width: 14px;
          height: 9px;
        }

        .orientation-square {
          width: 12px;
          height: 12px;
        }

        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .color-dot-wrap {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 2px solid transparent;
        }

        .color-dot-wrap.active {
          border-color: #2563eb;
        }

        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .sort-side-row {
          padding: 6px 7px;
        }

        .content-area {
          min-width: 0;
        }

        .search-row {
          display: flex;
          gap: 8px;
        }

        .search-box {
          flex: 1;
          height: 38px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font-size: 10px;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .search-box button {
          color: #94a3b8;
        }

        .tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          margin-top: 10px;
          padding-bottom: 2px;
        }

        .tag-chip {
          flex: none;
          padding: 6px 9px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 700;
        }

        .small-sort {
          margin-left: auto;
          flex: none;
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 800;
        }

        .small-sort span {
          color: #94a3b8;
        }

        .result-row {
          margin: 10px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 9px;
        }

        .masonry-grid {
          column-count: 6;
          column-gap: 11px;
          width: 100%;
        }

        .template-card {
          position: relative;
          width: 100%;
          display: inline-block;
          margin: 0 0 11px;
          break-inside: avoid;
          overflow: hidden;
          border-radius: 11px;
          background: #e2e8f0;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
          transform: translateZ(0);
        }

        .lazy-image-shell {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #e2e8f0;
        }

        .lazy-template-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #e2e8f0;
          transition:
            transform 0.25s ease,
            filter 0.25s ease;
        }

        .lazy-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: linear-gradient(
            110deg,
            #e2e8f0 8%,
            #f1f5f9 18%,
            #e2e8f0 33%
          );
          background-size: 200% 100%;
          animation: lazy-template-shimmer 1.35s linear infinite;
        }

        .lazy-image-failed {
          animation: none;
          color: #94a3b8;
        }

        .lazy-image-spinner {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2px solid rgba(37, 99, 235, 0.18);
          border-top-color: #2563eb;
          animation: lazy-template-spin 0.8s linear infinite;
        }

        @keyframes lazy-template-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes lazy-template-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .template-card img {
          width: 100%;
          display: block;
        }

        .template-card:hover img {
          transform: scale(1.03);
          filter: brightness(0.97);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(15, 23, 42, 0.18), transparent 24%),
            linear-gradient(to top, rgba(15, 23, 42, 0.28), transparent 28%);
        }

        .uses-badge {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 2;
          padding: 4px 7px;
          border-radius: 10px;
          color: #fff;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(4px);
          font-size: 7px;
          font-weight: 900;
        }

        .card-heart {
          position: absolute;
          top: 7px;
          left: 7px;
          z-index: 3;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          color: #64748b;
          display: grid;
          place-items: center;
          opacity: 0;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
        }

        .template-card:hover .card-heart,
        .template-card:focus-within .card-heart,
        .card-heart-active {
          opacity: 1;
        }

        .template-card:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* Touch screens have no hover: keep the favorite button reachable. */
        @media (hover: none) {
          .card-heart {
            opacity: 1;
          }
        }

        .card-heart-active {
          color: #ef4444;
        }

        .template-hover {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          z-index: 4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.2s ease;
        }

        .template-card:hover .template-hover {
          opacity: 1;
          transform: translateY(0);
        }

        .template-hover > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .template-hover strong {
          color: #fff;
          font-size: 8px;
          line-height: 1.2;
        }

        .template-hover span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 7px;
        }

        .template-hover button {
          flex: none;
          border-radius: 7px;
          padding: 6px 8px;
          background: #fff;
          color: #0f172a;
          font-size: 8px;
          font-weight: 900;
        }

        .empty-state {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .empty-heart {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #e2e8f0;
          color: #94a3b8;
        }

        .empty-state p {
          margin: 12px 0 0;
          font-size: 11px;
        }

        .reset-empty {
          margin-top: 14px;
          height: 33px;
          padding: 0 13px;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
        }

        .floating-tools {
          position: fixed;
          left: 10px;
          bottom: 12px;
          z-index: 60;
          display: flex;
          gap: 7px;
        }

        .yellow-float,
        .red-float {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
        }

        .yellow-float {
          background: #10b981;
          color: #fff;
          font-size: 18px;
        }

        .red-float {
          background: #2563eb;
          color: #fff;
          border: 3px solid #fff;
          font-size: 12px;
        }

        .modal-backdrop {
          position: fixed;
          cursor: pointer;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .template-modal {
          position: relative;
          cursor: default;
          width: min(1020px, 96vw);
          max-height: 92vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.28);
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 7;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #475569;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          z-index: 7;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #475569;
          transform: translateY(-50%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .modal-prev {
          left: 12px;
        }

        .modal-next {
          left: calc(100% - 394px);
        }

        .modal-image {
          position: relative;
          isolation: isolate;
          min-height: 560px;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
        }

        .modal-image img {
          width: 100%;
          height: 100%;
          max-height: 92vh;
          display: block;
          object-fit: cover;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .modal-details {
          padding: 36px 30px 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .modal-category {
          display: inline-flex;
          width: max-content;
          padding: 5px 9px;
          border-radius: 9999px;
          background: #10b981;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .modal-details h2 {
          margin: 11px 0 8px;
          font-size: 24px;
          line-height: 1.18;
          letter-spacing: -0.6px;
          color: #0f172a;
        }

        .modal-lead {
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.7;
        }

        .template-file-input {
          display: none;
        }

        .template-upload-card {
          margin-top: 20px;
          padding: 16px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 11px 12px;
          align-items: center;
        }

        .template-upload-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }

        .template-upload-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .template-upload-copy strong {
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
        }

        .template-upload-copy span {
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .template-upload-card.has-photo {
          border-color: #bfdbfe;
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
        }

        .template-user-preview {
          grid-column: 1 / -1;
          width: 100%;
          height: 140px;
          overflow: hidden;
          border-radius: 10px;
          background: #e2e8f0;
          border: 1px solid #dbeafe;
        }

        .template-user-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center;
          background: #0f172a;
        }

        .template-upload-btn {
          grid-column: 1 / -1;
          height: 38px;
          border: 1px solid #2563eb;
          border-radius: 9px;
          background: #2563eb;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .template-upload-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .template-upload-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .template-upload-actions {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 8px;
          min-width: 0;
        }

        .template-upload-actions .template-upload-btn {
          grid-column: auto;
          width: 100%;
          min-width: 0;
          padding: 0 8px;
        }

        .template-upload-qr-btn {
          min-width: 0;
          height: 38px;
          padding: 0 8px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #ffffff;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 9px;
          line-height: 1.25;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .template-upload-qr-btn:hover,
        .template-upload-qr-btn.active {
          border-color: #93c5fd;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .template-upload-qr-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .template-qr-upload-panel {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
        }

        .template-qr-upload-panel > p {
          margin: 0 0 10px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.6;
          text-align: center;
        }

        .template-qr-upload-panel > aside {
          margin-inline: auto;
        }

        .template-upload-card small {
          grid-column: 1 / -1;
          color: #94a3b8;
          font-size: 8px;
          text-align: center;
        }

        .template-generation-error {
          margin-top: 10px;
          padding: 9px 10px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 8px;
          line-height: 1.5;
        }

        .template-how-it-works {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 34px 1fr;
          align-items: center;
          gap: 8px;
        }

        .template-how-step {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .template-how-step span {
          width: 21px;
          height: 21px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex: none;
          background: #eff6ff;
          color: #2563eb;
          font-size: 8px;
          font-weight: 900;
        }

        .template-how-step p {
          margin: 0;
          color: #475569;
          font-size: 8px;
          line-height: 1.4;
          font-weight: 800;
        }

        .template-step-line {
          height: 1px;
          background: #e2e8f0;
        }

        .template-generate-btn {
          margin-top: 19px;
          width: 100%;
          height: 44px;
          border: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.18);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .template-generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 11px 26px rgba(37, 99, 235, 0.24);
        }

        .template-generate-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
          box-shadow: none;
        }

        .modal-image.has-generated-image {
          background: #0f172a;
        }

        .modal-image.has-generated-image img {
          object-fit: contain;
        }

        .generated-image-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.12) 0%,
            rgba(15, 23, 42, 0) 58%,
            rgba(15, 23, 42, 0.7) 100%
          );
          pointer-events: none;
        }

        .generated-image-badge {
          display: inline-flex;
          align-items: center;
          min-height: 29px;
          padding: 0 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.94);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
        }

        .generated-download-btn {
          min-height: 36px;
          padding: 0 13px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 7px 20px rgba(15, 23, 42, 0.22);
          pointer-events: auto;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .generated-download-btn:hover {
          background: #fff;
          transform: translateY(-1px);
        }

        .crop-backdrop {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(15, 23, 42, 0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .crop-modal {
          width: min(760px, 96vw);
          max-height: 94vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.35);
        }

        .crop-header {
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #e2e8f0;
        }

        .crop-header > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crop-header strong {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }

        .crop-header span {
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .crop-close {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .crop-close:hover {
          background: #f1f5f9;
        }

        .crop-close:disabled,
        .crop-cancel-btn:disabled,
        .crop-apply-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .crop-stage {
          position: relative;
          width: 100%;
          height: min(62vh, 520px);
          min-height: 330px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0f172a;
          overscroll-behavior: contain;
        }

        .crop-stage .ReactCrop {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          margin: 0 auto;
          background: #0f172a;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .crop-stage .ReactCrop__crop-selection {
          cursor: move;
          touch-action: none;
          border: 2px solid #ffffff;
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.42),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }

        .crop-stage .ReactCrop__drag-handle {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 3px;
          background: #2563eb;
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.35),
            0 2px 7px rgba(0, 0, 0, 0.22);
          z-index: 4;
          touch-action: none;
        }

        .crop-stage .ReactCrop__drag-handle.ord-n {
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-s {
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-e {
          top: 50%;
          right: -8px;
          transform: translateY(-50%);
          cursor: ew-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-w {
          top: 50%;
          left: -8px;
          transform: translateY(-50%);
          cursor: ew-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-nw {
          top: -8px;
          left: -8px;
          cursor: nwse-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-ne {
          top: -8px;
          right: -8px;
          cursor: nesw-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-se {
          right: -8px;
          bottom: -8px;
          cursor: nwse-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-sw {
          bottom: -8px;
          left: -8px;
          cursor: nesw-resize;
        }

        .crop-error {
          margin: 0;
          padding: 9px 18px;
          color: #b91c1c;
          background: #fef2f2;
          font-size: 9px;
          font-weight: 700;
        }

        .crop-stage .ReactCrop__child-wrapper {
          max-width: 100%;
          max-height: calc(min(62vh, 520px) - 28px);
        }

        .crop-stage .ReactCrop__child-wrapper img,
        .crop-source-image {
          display: block;
          max-width: 100%;
          max-height: calc(min(62vh, 520px) - 28px);
          width: auto;
          height: auto;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .crop-controls {
          padding: 11px 18px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .crop-controls > span {
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .crop-controls-help {
          color: #64748b !important;
          font-size: 8px !important;
          font-weight: 600 !important;
          text-align: center;
        }

        .crop-actions {
          padding: 13px 18px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          background: #fff;
        }

        .crop-cancel-btn,
        .crop-apply-btn {
          min-height: 38px;
          padding: 0 15px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 900;
        }

        .crop-cancel-btn {
          background: #fff;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .crop-cancel-btn:hover {
          background: #f8fafc;
        }

        .crop-apply-btn {
          background: #2563eb;
          color: #fff;
          border: 1px solid #2563eb;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
        }

        .crop-apply-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .template-favorite-btn {
          margin-top: 9px;
          width: 100%;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #ffffff;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            color 0.2s ease,
            background 0.2s ease;
        }

        .template-favorite-btn:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .template-favorite-btn.active {
          border-color: #fecaca;
          background: #fef2f2;
          color: #ef4444;
        }

        .template-note {
          margin-top: 11px;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f8fafc;
          color: #64748b;
          font-size: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
        }

        @media (max-width: 1600px) {
          .masonry-grid {
            column-count: 6;
          }
        }

        @media (max-width: 1300px) {
          .masonry-grid {
            column-count: 5;
          }

          .workspace {
            grid-template-columns: 230px minmax(0, 1fr);
          }

          .modal-next {
            left: calc(100% - 374px);
          }
        }

        @media (max-width: 1050px) {
          .masonry-grid {
            column-count: 4;
          }

          .workspace {
            grid-template-columns: 215px minmax(0, 1fr);
          }

          .template-modal {
            grid-template-columns: 1fr 330px;
          }

          .modal-next {
            left: calc(100% - 344px);
          }
        }

        @media (max-width: 820px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-actions {
            width: 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .workspace {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
            max-height: none;
          }

          .category-list {
            max-height: 240px;
          }

          .masonry-grid {
            column-count: 3;
          }

          .template-modal {
            grid-template-columns: 1fr;
            max-height: 94vh;
            overflow-y: auto;
          }

          .modal-image {
            min-height: 390px;
            max-height: 56vh;
          }

          .modal-next {
            left: auto;
            right: 12px;
          }
        }

        @media (max-width: 620px) {
          .crop-backdrop {
            padding: 10px;
          }

          .crop-stage {
            height: 54vh;
            min-height: 280px;
            padding: 10px;
          }

          .crop-stage .ReactCrop__child-wrapper img,
          .crop-source-image {
            max-height: calc(54vh - 20px);
          }

          .crop-controls-help {
            font-size: 7px !important;
          }

          .main-content {
            padding: 0 11px 14px;
          }

          .page-header h1 {
            font-size: 20px;
          }

          .masonry-grid {
            column-count: 2;
            column-gap: 8px;
          }

          .template-card {
            margin-bottom: 8px;
            border-radius: 9px;
          }

          .page-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .favorites-btn {
            grid-column: 1 / -1;
          }

          .modal-details {
            padding: 20px;
          }

          .modal-actions {
            grid-template-columns: 1fr 1fr;
          }

          .modal-primary {
            grid-column: 1 / -1;
          }
        }
    `}</style>
  );
}
