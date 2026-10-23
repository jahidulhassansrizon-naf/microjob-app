"use client";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`;

export default function AITemplateStyles() {
  return (
    <>
    <style>{FONT_IMPORT}</style>
    <style jsx global>{`
        .ai-page,
        .ai-page * {
          box-sizing: border-box;
        }

        .ai-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #E9DDC3 0%, #EFE5CE 100%);
          color: #3B2F1E;
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
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #3B2F1E;
        }

        .page-header p {
          margin: 5px 0 0;
          font-size: 14px;
          color: #6B5A40;
          line-height: 1.7;
        }

        .page-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .sort-pill {
          height: 38px;
          padding: 0 14px;
          border: 1px solid #E3D6B8;
          border-radius: 12px;
          background: #FBF6E8;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #5A4A32;
          font-size: 15px;
          font-weight: 600;
          transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
        }

        .sort-pill.selected {
          color: #fff;
          border-color: #DC2626;
          background: #DC2626;
        }

        .sort-pill.selected-light,
        .sort-pill.favorite-active {
          border-color: #DC2626;
          background: #FEE9E9;
          color: #B91C1C;
        }

        .workspace {
          display: grid;
          grid-template-columns: 288px minmax(0, 1fr);
          gap: 13px;
          align-items: start;
        }

        .sidebar {
          background: #F2E8D2;
          border: 1px solid #E3D6B8;
          border-radius: 16px;
          padding: 14px 12px;
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 140px);
          overflow: auto;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 17px;
          font-weight: 600;
          color: #3B2F1E;
        }

        .sidebar-heading button {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #6B5A40;
          font-size: 15px;
          font-weight: 600;
        }

        .filter-section-title {
          margin: 14px 0 7px;
          color: #6B5A40;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
        }

        .category-list {
          max-height: 290px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .category-row {
          width: 100%;
          min-height: 38px;
          padding: 0 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #5A4A32;
          font-size: 15px;
          text-align: left;
          font-weight: 500;
          transition: background 0.18s ease;
        }

        .category-row b {
          min-width: 26px;
          padding: 3px 7px;
          border-radius: 10px;
          background: #F3E9D2;
          color: #5A4A32;
          font-size: 12px;
          text-align: center;
          font-weight: 700;
        }

        .category-row.active {
          background: #F6D9A8;
          color: #B91C1C;
          font-weight: 600;
        }

        .category-row.active b {
          background: #DC2626;
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
          min-height: 60px;
          border: 1px solid #E3D6B8;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #FBF6E8;
          color: #5A4A32;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.18s ease, border-color 0.18s ease;
        }

        .gender-card.active,
        .orientation-card.active {
          color: #B91C1C;
          border-color: #DC2626;
          background: #F6D9A8;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.4);
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
          padding: 8px 9px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          color: #5A4A32;
          font-size: 15px;
          font-weight: 500;
          transition: background 0.18s ease;
        }

        .radio-row.active,
        .sort-side-row.active {
          background: #F6D9A8;
          color: #B91C1C;
        }

        .radio-row strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
        }

        .radio-row small {
          display: block;
          margin-top: 1px;
          color: #6B5A40;
          font-size: 13px;
        }

        .radio-dot {
          width: 16px;
          height: 16px;
          border: 1.5px solid #D8C9A6;
          border-radius: 50%;
          flex: none;
          background: #FBF6E8;
        }

        .radio-dot.checked {
          border-color: #DC2626;
          box-shadow: inset 0 0 0 3px #FBF6E8;
          background: #DC2626;
        }

        .orientation-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 5px;
        }

        .orientation-card {
          min-height: 48px;
          flex-direction: row;
          gap: 8px;
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
          border-color: #DC2626;
        }

        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .sort-side-row {
          padding: 8px 9px;
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
          height: 46px;
          padding: 0 14px;
          border: 1px solid #E3D6B8;
          border-radius: 12px;
          background: #FBF6E8;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7A6A50;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #3B2F1E;
          font-size: 16px;
        }

        .search-box input::placeholder {
          color: #B0A080;
        }

        .search-box button {
          color: #7A6A50;
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
          padding: 7px 13px;
          border: 1px solid #E3D6B8;
          border-radius: 9999px;
          background: #FBF6E8;
          color: #5A4A32;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .small-sort {
          margin-left: auto;
          flex: none;
          padding: 7px 13px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #E3D6B8;
          border-radius: 9999px;
          background: #FBF6E8;
          color: #5A4A32;
          font-size: 14px;
          font-weight: 500;
        }

        .small-sort span {
          color: #6B5A40;
        }

        .result-row {
          margin: 10px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #6B5A40;
          font-size: 14px;
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
          border-radius: 16px;
          background: #E3D6B8;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
          transform: translateZ(0);
          transition: box-shadow 0.2s ease;
        }

        .lazy-image-shell {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #E3D6B8;
        }

        .lazy-template-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #E3D6B8;
          transition:
            transform 0.25s ease,
            filter 0.25s ease;
        }

        .lazy-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: linear-gradient(110deg, #E3D6B8 8%, #F3E9D2 18%, #E3D6B8 33%);
          background-size: 200% 100%;
          animation: lazy-template-shimmer 1.35s linear infinite;
        }

        .lazy-image-failed {
          animation: none;
          color: #7A6A50;
        }

        .lazy-image-spinner {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2px solid rgba(220, 38, 38, 0.18);
          border-top-color: #DC2626;
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
          background: linear-gradient(to bottom, rgba(59, 47, 30, 0.18), transparent 24%), linear-gradient(to top, rgba(59, 47, 30, 0.55), transparent 42%);
        }

        .uses-badge {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 2;
          padding: 4px 9px;
          border-radius: 10px;
          color: #fff;
          background: rgba(59, 47, 30, 0.78);
          backdrop-filter: blur(4px);
          font-size: 12px;
          font-weight: 700;
        }

        .card-heart {
          position: absolute;
          top: 7px;
          left: 7px;
          z-index: 3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(251, 246, 232, 0.95);
          color: #6B5A40;
          display: grid;
          place-items: center;
          opacity: 0;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
        }

        .template-card:hover .card-heart,
        .template-card:focus-within .card-heart,
        .card-heart-active {
          opacity: 1;
        }

        .template-card:focus-visible {
          outline: 2px solid #DC2626;
          outline-offset: 2px;
        }

        /* Touch screens have no hover: keep the favorite button reachable. */
        @media (hover: none) {
          .card-heart {
            opacity: 1;
          width: 32px;
          height: 32px;
          color: #6B5A40;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
        }
        }

        .card-heart-active {
          color: #DC2626;
        }

        .template-hover {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          z-index: 4;
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 7px;
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.2s ease;
          flex-direction: column;
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
          font-size: 14px;
          line-height: 1.3;
        }

        .template-hover span {
          margin-top: 2px;
          color: rgba(251, 246, 232, 0.9);
          font-size: 12px;
        }

        .template-hover button {
          flex: none;
          border-radius: 10px;
          padding: 7px 10px;
          background: #FBF6E8;
          color: #B91C1C;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .empty-state {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #6B5A40;
        }

        .empty-heart {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: #F3E9D2;
          color: #7A6A50;
        }

        .empty-state p {
          margin: 12px 0 0;
          font-size: 16px;
          font-style: italic;
        }

        .reset-empty {
          margin-top: 14px;
          height: 42px;
          padding: 0 18px;
          border-radius: 12px;
          background: #DC2626;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
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
          box-shadow: 0 6px 20px rgba(59, 47, 30, 0.12);
        }

        .yellow-float {
          background: #DC2626;
          color: #fff;
          font-size: 20px;
        }

        .red-float {
          background: #B91C1C;
          color: #fff;
          border: 3px solid #FBF6E8;
          font-size: 14px;
        }

        .modal-backdrop {
          position: fixed;
          cursor: pointer;
          inset: 0;
          z-index: 100;
          background: rgba(42, 32, 20, 0.62);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .template-modal {
          position: relative;
          cursor: default;
          width: min(1060px, 96vw);
          max-height: 92vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 400px;
          background: #FBF6E8;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(59, 47, 30, 0.12), 0 8px 10px -6px rgba(59, 47, 30, 0.12);
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
          background: rgba(251, 246, 232, 0.94);
          color: #5A4A32;
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
          background: rgba(251, 246, 232, 0.94);
          color: #5A4A32;
          transform: translateY(-50%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .modal-prev {
          left: 12px;
        }

        .modal-next {
          left: calc(100% - 434px);
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
          background: #E3D6B8;
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
          padding: 38px 30px 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .modal-category {
          display: inline-flex;
          width: max-content;
          padding: 5px 12px;
          border-radius: 9999px;
          background: #DC2626;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .modal-details h2 {
          margin: 11px 0 8px;
          font-size: 28px;
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: #3B2F1E;
          font-weight: 700;
        }

        .modal-lead {
          margin: 0;
          color: #6B5A40;
          font-size: 15px;
          line-height: 1.7;
        }

        .template-file-input {
          display: none;
        }

        .template-upload-card {
          margin-top: 20px;
          padding: 16px;
          border: 1px dashed #B0A080;
          border-radius: 16px;
          background: #F6EEDB;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 11px 12px;
          align-items: center;
        }

        .template-upload-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #FEE9E9;
          color: #DC2626;
          border: 1px solid #FBB6B6;
        }

        .template-upload-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .template-upload-copy strong {
          color: #3B2F1E;
          font-size: 16px;
          font-weight: 600;
        }

        .template-upload-copy span {
          color: #6B5A40;
          font-size: 14px;
          line-height: 1.5;
        }

        .template-upload-card.has-photo {
          border-color: #DC2626;
          background: #FEE9E9;
        }

        .template-user-preview {
          grid-column: 1 / -1;
          width: 100%;
          height: 140px;
          overflow: hidden;
          border-radius: 12px;
          background: #E3D6B8;
          border: 1px solid #FBB6B6;
        }

        .template-user-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center;
          background: #2A2014;
        }

        .template-upload-btn {
          grid-column: 1 / -1;
          height: 46px;
          border: 1px solid #DC2626;
          border-radius: 12px;
          background: #DC2626;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .template-upload-btn:hover {
          background: #B91C1C;
          border-color: #B91C1C;
        }

        .template-upload-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
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
          padding: 0 10px;
        }

        .template-upload-qr-btn {
          min-width: 0;
          height: auto;
          padding: 6px 10px;
          border: 1px solid #FBB6B6;
          border-radius: 12px;
          background: #FBF6E8;
          color: #B91C1C;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease;
          min-height: 46px;
        }

        .template-upload-qr-btn:hover,
        .template-upload-qr-btn.active {
          border-color: #DC2626;
          background: #FEE9E9;
          color: #B91C1C;
        }

        .template-upload-qr-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .template-qr-upload-panel {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid #E3D6B8;
          border-radius: 16px;
          background: #FBF6E8;
        }

        .template-qr-upload-panel > p {
          margin: 0 0 10px;
          color: #6B5A40;
          font-size: 14px;
          line-height: 1.6;
          text-align: center;
        }

        .template-qr-upload-panel > aside {
          margin-inline: auto;
        }

        .template-upload-card small {
          grid-column: 1 / -1;
          color: #6B5A40;
          font-size: 13px;
          text-align: center;
        }

        .template-generation-error {
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid #FBB6B6;
          border-radius: 12px;
          background: #FEE9E9;
          color: #b91c1c;
          font-size: 14px;
          line-height: 1.55;
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
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex: none;
          background: #FEE9E9;
          color: #B91C1C;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid #FBB6B6;
        }

        .template-how-step p {
          margin: 0;
          color: #5A4A32;
          font-size: 14px;
          line-height: 1.4;
          font-weight: 600;
        }

        .template-step-line {
          height: 1px;
          background: #D8C9A6;
        }

        .template-generate-btn {
          margin-top: 19px;
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #D42020;
          color: #ffffff;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .template-generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(59, 47, 30, 0.12);
          background: #AE1717;
        }

        .template-generate-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
          background: #D42020;
        }

        .modal-image.has-generated-image {
          background: #2A2014;
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
          background: linear-gradient(180deg, rgba(59, 47, 30, 0.12) 0%, rgba(59, 47, 30, 0) 58%, rgba(59, 47, 30, 0.7) 100%);
          pointer-events: none;
        }

        .generated-image-badge {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.94);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
        }

        .generated-download-btn {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(251, 246, 232, 0.96);
          color: #3B2F1E;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 7px 20px rgba(59, 47, 30, 0.22);
          pointer-events: auto;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .generated-download-btn:hover {
          background: #FBF6E8;
          transform: translateY(-1px);
        }

        .crop-backdrop {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(42, 32, 20, 0.78);
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
          border-radius: 16px;
          background: #FBF6E8;
          box-shadow: 0 20px 25px -5px rgba(59, 47, 30, 0.12), 0 8px 10px -6px rgba(59, 47, 30, 0.12);
        }

        .crop-header {
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #E3D6B8;
        }

        .crop-header > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crop-header strong {
          color: #3B2F1E;
          font-size: 17px;
          font-weight: 600;
        }

        .crop-header span {
          color: #6B5A40;
          font-size: 14px;
          line-height: 1.5;
        }

        .crop-close {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #F6EEDB;
          color: #5A4A32;
          border: 1px solid #E3D6B8;
        }

        .crop-close:hover {
          background: #EFE3C8;
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
          background: #2A2014;
          overscroll-behavior: contain;
        }

        .crop-stage .ReactCrop {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          margin: 0 auto;
          background: #2A2014;
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
            0 0 0 1px rgba(59, 47, 30, 0.42),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }

        .crop-stage .ReactCrop__drag-handle {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 3px;
          background: #DC2626;
          box-shadow:
            0 0 0 1px rgba(59, 47, 30, 0.35),
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
          padding: 10px 18px;
          color: #b91c1c;
          background: #FEE9E9;
          font-size: 14px;
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
          border-top: 1px solid #E3D6B8;
          border-bottom: 1px solid #E3D6B8;
        }

        .crop-controls > span {
          color: #5A4A32;
          font-size: 14px;
          font-weight: 600;
        }

        .crop-controls-help {
          color: #6B5A40 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          text-align: center;
        }

        .crop-actions {
          padding: 13px 18px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          background: #FBF6E8;
        }

        .crop-cancel-btn,
        .crop-apply-btn {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .crop-cancel-btn {
          background: #FBF6E8;
          color: #B91C1C;
          border: 1px solid #FBB6B6;
        }

        .crop-cancel-btn:hover {
          background: #FEE9E9;
        }

        .crop-apply-btn {
          background: #D42020;
          color: #fff;
          border: 1px solid #D42020;
          box-shadow: 0 1px 2px rgba(59, 47, 30, 0.12);
        }

        .crop-apply-btn:hover {
          background: #AE1717;
          border-color: #AE1717;
        }

        .template-favorite-btn {
          margin-top: 9px;
          width: 100%;
          height: 46px;
          border: 1px solid #E3D6B8;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #FBF6E8;
          color: #5A4A32;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            color 0.2s ease,
            background 0.2s ease;
        }

        .template-favorite-btn:hover {
          border-color: #D8C9A6;
          color: #3B2F1E;
          background: #EFE3C8;
        }

        .template-favorite-btn.active {
          border-color: #FBB6B6;
          background: #FEE9E9;
          color: #DC2626;
        }

        .template-note {
          margin-top: 11px;
          padding: 10px 12px;
          border-radius: 12px;
          background: #F6EEDB;
          color: #6B5A40;
          font-size: 13px;
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
            grid-template-columns: 270px minmax(0, 1fr);
          }

          .modal-next {
            left: calc(100% - 414px);
          }
        }

        @media (max-width: 1050px) {
          .masonry-grid {
            column-count: 4;
          }

          .workspace {
            grid-template-columns: 250px minmax(0, 1fr);
          }

          .template-modal {
            grid-template-columns: 1fr 370px;
          }

          .modal-next {
            left: calc(100% - 384px);
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
          background: rgba(42, 32, 20, 0.78);
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
            font-size: 12px !important;
          }

          .main-content {
            padding: 0 11px 14px;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .masonry-grid {
            column-count: 2;
            column-gap: 8px;
          }

          .template-card {
            margin-bottom: 8px;
            border-radius: 12px;
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
            padding: 38px 30px 30px;
          min-height: 0;
        }

          .modal-actions {
            grid-template-columns: 1fr 1fr;
          }

          .modal-primary {
            grid-column: 1 / -1;
          }
        }

        /* ---- Warm Sand + Red: font, focus, hover, scrollbars ---- */
        .page-font.page-font,
        .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .page-font h1,
        .page-font h2,
        .page-font h3,
        .page-font h4 {
          letter-spacing: -0.01em;
        }

        .ai-page button:focus-visible,
        .ai-page a:focus-visible,
        .ai-page [role="button"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.4);
        }

        .search-box:focus-within {
          border-color: #DC2626;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
        }

        .sort-pill:hover,
        .tag-chip:hover,
        .small-sort:hover {
          background: #EFE3C8;
        }

        .sort-pill.selected:hover {
          background: #B91C1C;
          border-color: #B91C1C;
        }

        .category-row:hover:not(.active),
        .radio-row:hover:not(.active),
        .sort-side-row:hover:not(.active) {
          background: #EFE3C8;
        }

        .gender-card:hover:not(.active),
        .orientation-card:hover:not(.active) {
          background: #EFE3C8;
          border-color: #D8C9A6;
        }

        .reset-empty:hover {
          background: #B91C1C;
        }

        .reset-empty:active,
        .sort-pill:active,
        .tag-chip:active,
        .template-upload-btn:not(:disabled):active,
        .template-upload-qr-btn:not(:disabled):active,
        .template-favorite-btn:active,
        .crop-cancel-btn:not(:disabled):active,
        .crop-apply-btn:not(:disabled):active,
        .generated-download-btn:active {
          transform: scale(0.98);
        }

        .template-generate-btn:not(:disabled):active {
          transform: scale(0.98);
        }

        .template-card:hover {
          box-shadow: 0 4px 12px rgba(59, 47, 30, 0.12);
        }

        .scroll {
          scrollbar-width: thin;
          scrollbar-color: #F87171 transparent;
        }

        .scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .scroll::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          margin: 10px 0;
        }

        .scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F87171, #DC2626);
          border-radius: 999px;
          border: 3px solid #F2E8D2;
          min-height: 48px;
        }

        .scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #EF4444, #B91C1C);
        }
    `}</style>
    </>
  );
}
