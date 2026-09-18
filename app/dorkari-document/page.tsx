"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Footer from "@/components/Footer";

type Template = {
  id: number;
  category: string;
  title: string;
  description: string;
  stamp?: boolean;
};

type FAQ = {
  id: number;
  num: string;
  question: string;
  answer: string;
};

const categories = [
  "All Templates",
  "Affidavit",
  "Personal",
  "Legal",
  "Resignation letter",
  "Case",
  "Contract",
  "Business",
  "Family dispute",
  "Notice",
];

const docTypes = ["All Documents", "General document", "Stamp document"];

const faqs: FAQ[] = [
  {
    id: 1,
    num: "01",
    question: "What are the necessary documents?",
    answer:
      "You can choose from various available templates including contracts, affidavits, notices, and personal legal forms depending on your requirements.",
  },
  {
    id: 2,
    num: "02",
    question: "Can these documents be created for free?",
    answer:
      "Yes, basic document templates are free to explore and customize on our platform.",
  },
  {
    id: 3,
    num: "03",
    question: "What is a stamp document and why is it needed?",
    answer:
      "Stamp documents are legal agreements executed on official non-judicial stamp paper required for legally binding contracts and court submissions.",
  },
  {
    id: 4,
    num: "04",
    question: "How long does it take to create a document?",
    answer:
      "It takes only a few minutes! Fill in the required details into the selected template and download your document instantly.",
  },
  {
    id: 5,
    num: "05",
    question: "How many types of documents are available?",
    answer:
      "We offer over 50+ document templates across multiple categories including Personal, Legal, Contract, Business, Affidavit, and Notice.",
  },
  {
    id: 6,
    num: "06",
    question:
      "Is the document created admissible in court or in a government office?",
    answer:
      "Yes, documents created following proper legal formatting and printed on valid stamp paper with required signatures are legally valid and admissible.",
  },
];

const templates: Template[] = [
  {
    id: 1,
    category: "Affidavit",
    title: "Request for leave to perform the holy Hajj pilgrimage",
    description:
      "An application submitted to the authorities seeking approval for a specific period of leave.",
  },
  {
    id: 2,
    category: "Personal",
    title: "Experience certificate of the working person",
    description: "Working person's experience certificate",
  },
  {
    id: 3,
    category: "Legal",
    title: "Cheque Dishonour Case RG/NI Act Complaint Letter",
    description:
      "Using this template, a plaintiff can file an RG (prayer letter) in court alleging cheque dishonour.",
    stamp: true,
  },
  {
    id: 4,
    category: "Resignation letter",
    title: "Regarding resignation from the post of editor.",
    description:
      "I am no longer able to fulfill my duties as the editor of the Ganamatra Society due to...",
  },
  {
    id: 5,
    category: "Case",
    title: "Appeal against the plaintiff's charge sheet.",
    description:
      "This objection petition was filed in the interest of justice, dissatisfied with the...",
    stamp: true,
  },
  {
    id: 6,
    category: "Contract",
    title: "Cropland mortgage and conditional possession transfer agreement.",
    description:
      "An agreement to transfer possession and ownership of land subject to a mortgage i...",
    stamp: true,
  },
  {
    id: 7,
    category: "Personal",
    title:
      "Request to file a general diary for security reasons due to receiving death...",
    description:
      "Application to file a General Diary (GD) in response to death threats received to...",
  },
  {
    id: 8,
    category: "Business",
    title: "Pharmacy/Drug License Transfer Affidavit, Change of Ownership",
    description:
      "Using this affidavit, a drug/pharmacy owner can transfer the ownership of his license t...",
    stamp: true,
  },
  {
    id: 9,
    category: "Resignation letter",
    title: "Application for exemption from employment.",
    description:
      "I humbly request that you submit your resignation and be relieved from your...",
  },
  {
    id: 10,
    category: "Affidavit",
    title: "Affidavit of correction of errors in National Identity Card or NID",
    description: "Legal affidavit document to correct mistakes",
    stamp: true,
  },
  {
    id: 11,
    category: "Case",
    title:
      "Regarding the issue of summons to the bank manager to testify in a check...",
    description:
      "Regarding the issue of summons to the bank manager concerned to testify in the...",
  },
  {
    id: 12,
    category: "Personal",
    title: "Death Certificate For Non-Muslims",
    description:
      "It is a legal document to officially confirm the date, cause, and place of death of a...",
  },
  {
    id: 13,
    category: "Contract",
    title:
      "Regarding the execution of a private car sale agreement and final sales contract.",
    description:
      "A humble request is made to accept the deposit of the private car and execute the...",
  },
  {
    id: 14,
    category: "Contract",
    title:
      "Gold jewelry mortgage and conditional ownership transfer agreement.",
    description:
      "A valid legal agreement regarding the receipt of cash after mortgage of gold...",
    stamp: true,
  },
  {
    id: 15,
    category: "Family dispute",
    title:
      "Solemnization executed through court mediation in the case of appointment o...",
    description:
      "Application for settlement of the case and determination of custody as per the terms...",
  },
  {
    id: 16,
    category: "Personal",
    title: "Character certificate",
    description: "Character recognition of a person's character and morality.",
  },
  {
    id: 17,
    category: "Contract",
    title: "Flat mortgage deed.",
    description:
      "The rights, responsibilities, and terms of both parties were determined according to...",
  },
  {
    id: 18,
    category: "Personal",
    title: "Application for dismissal from employment",
    description: "Application for dismissal from employment",
  },
  {
    id: 19,
    category: "Case",
    title: "Bail application of the accused detained in jail.",
    description:
      "The accused, who was in jail, was released on bail and a request for justice was made.",
    stamp: true,
  },
  {
    id: 20,
    category: "Personal",
    title: "Affidavit of Exoneration after Road Accident (Compromise)",
    description:
      "Through this affidavit, a person or his family declares that the driver and owner of the...",
    stamp: true,
  },
  {
    id: 21,
    category: "Business",
    title: "Business partnership sale agreement document",
    description: "Business Partnership Sale Agreement Terms And Conditions",
    stamp: true,
  },
  {
    id: 22,
    category: "Contract",
    title:
      "Regarding the execution of auto CNG sales collateral and final sales contract.",
    description:
      "A humble request is made to accept the Auto CNG pledge and execute the final sal...",
    stamp: true,
  },
  {
    id: 23,
    category: "Affidavit",
    title: "Affidavit regarding personal information and permanent address",
    description: "Birthright citizenship and permanent address confirmation",
  },
  {
    id: 24,
    category: "Notice",
    title:
      "Regarding the scheduling of on-site investigations in civil cases and issuing...",
    description:
      "Regarding the proper notice to the parties concerned, informing them of the...",
  },
  {
    id: 25,
    category: "Affidavit",
    title: "Regarding requisition of various documents and supporting papers",
    description:
      "A formal affidavit format for submitting required documents to an authority.",
  },
  {
    id: 26,
    category: "Legal",
    title: "Application for temporary custody and guardianship",
    description:
      "A legal application seeking temporary custody of a minor under applicable law.",
  },
  {
    id: 27,
    category: "Case",
    title: "Application for time extension in a pending case",
    description:
      "A petition requesting additional time to prepare and submit the necessary papers.",
  },
  {
    id: 28,
    category: "Personal",
    title: "Family Certificate",
    description: "Official certification of family members",
  },
  {
    id: 29,
    category: "Contract",
    title: "Semi-finished tin shophouse mortgage document.",
    description:
      "A valid and binding legal agreement executed between two parties regarding t...",
    stamp: true,
  },
  {
    id: 30,
    category: "Resignation letter",
    title:
      "Application form for voluntary resignation from the post of City...",
    description:
      "I am voluntarily resigning from the position of City Corporation Councillor due to health...",
  },
  {
    id: 31,
    category: "Personal",
    title: "Orphan's certificate/certificate",
    description:
      "This is an official certificate to legally confirm the identity and current status of a...",
  },
  {
    id: 32,
    category: "Personal",
    title: "Income Certificate Application",
    description:
      "Application template for obtaining official income certification",
  },
  {
    id: 33,
    category: "Personal",
    title: "Death Certificate - Muslim",
    description:
      "It is a legal document to officially confirm the date, cause, and place of death of a... person.",
  },
  {
    id: 34,
    category: "Personal",
    title: "Job application form",
    description: "Prepare application forms for any job",
  },
  {
    id: 35,
    category: "Resignation letter",
    title: "President's resignation letter.",
    description:
      "The resignation letter was submitted as it was impossible to fulfill the duties of the... president.",
  },
  {
    id: 36,
    category: "Affidavit",
    title:
      "Affidavit regarding matching father's name - (NID, Government Document)",
    description:
      "In this affidavit, the declarant clarifies the fact that his father's name is mentioned in...",
    stamp: true,
  },
  {
    id: 37,
    category: "Legal",
    title: "A promise to take money from the bank",
    description: "Affidavit for taking money from Hawalat",
  },
  {
    id: 38,
    category: "Affidavit",
    title: "Affidavit regarding family relationship verification",
    description:
      "A standard affidavit for verifying family relationship and identity information.",
    stamp: true,
  },
  {
    id: 39,
    category: "Business",
    title: "Vendor agreement for supply of products and services",
    description:
      "A business agreement covering supply terms, payment, delivery, and responsibilities.",
  },
  {
    id: 40,
    category: "Notice",
    title: "Legal notice for payment of outstanding dues",
    description:
      "A notice demanding settlement of outstanding dues within a specified time.",
  },
  {
    id: 41,
    category: "Contract",
    title: "House rent agreement",
    description:
      "Rental terms covering rent, deposit, duration, utilities, and responsibilities.",
    stamp: true,
  },
  {
    id: 42,
    category: "Personal",
    title: "Travel consent letter",
    description: "A consent letter for travel and related arrangements.",
  },
  {
    id: 43,
    category: "Case",
    title: "Petition for certified copy of court record",
    description:
      "A petition for obtaining an official certified copy of a court record or order.",
  },
  {
    id: 44,
    category: "Business",
    title: "Authorization letter for business representative",
    description: "Authorization to represent a business in a specified matter.",
  },
  {
    id: 45,
    category: "Family dispute",
    title: "Family settlement agreement",
    description:
      "A written settlement covering mutually agreed family matters and obligations.",
  },
  {
    id: 46,
    category: "Legal",
    title: "Power of attorney document",
    description:
      "Authorization for a representative to act on behalf of another person.",
  },
  {
    id: 47,
    category: "Affidavit",
    title: "Affidavit for name correction",
    description:
      "A standard affidavit for correcting a person's name across official records.",
    stamp: true,
  },
  {
    id: 48,
    category: "Personal",
    title: "Address confirmation certificate",
    description:
      "A certificate confirming current residential address and identity details.",
  },
  {
    id: 49,
    category: "Notice",
    title: "Notice for appearance before authority",
    description:
      "Formal notice asking a person to appear before an authority on a specified date.",
  },
  {
    id: 50,
    category: "Contract",
    title: "Loan repayment agreement",
    description:
      "Agreement describing repayment schedule, conditions, and responsibilities.",
  },
  {
    id: 51,
    category: "Business",
    title: "Shop ownership transfer agreement",
    description:
      "An agreement covering transfer of ownership and related business obligations.",
    stamp: true,
  },
  {
    id: 52,
    category: "Personal",
    title: "Consent letter for educational application",
    description:
      "Consent letter prepared for an educational or institutional application.",
  },
  {
    id: 53,
    category: "Case",
    title: "Application for adjournment of hearing",
    description: "A formal request to postpone a hearing to a later date.",
  },
  {
    id: 54,
    category: "Legal",
    title: "Declaration of truthfulness",
    description:
      "A declaration confirming that the statements and information provided are true.",
  },
];

function DocumentIcon() {
  const lineBase: CSSProperties = {
    height: "3px",
    borderRadius: "2px",
    flexShrink: 0,
  };

  return (
    <div
      className="document-preview-paper-wrap"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className="document-preview-paper"
        style={{
          width: "52%",
          aspectRatio: "0.74 / 1",
          background: "rgb(255, 255, 255)",
          boxShadow:
            "rgba(20, 20, 30, 0.28) 0px 10px 26px -8px, rgba(20, 20, 30, 0.08) 0px 2px 6px",
          borderRadius: "3px",
          padding: "13% 12%",
          display: "flex",
          flexDirection: "column",
          gap: "6%",
        }}
      >
        <div
          style={{
            ...lineBase,
            width: "46%",
            background: "rgb(196, 196, 203)",
            alignSelf: "flex-end",
            marginBottom: "4%",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "72%",
            background: "rgb(196, 196, 203)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "94%",
            background: "rgb(228, 228, 234)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "88%",
            background: "rgb(228, 228, 234)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "96%",
            background: "rgb(228, 228, 234)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "60%",
            background: "rgb(228, 228, 234)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "90%",
            background: "rgb(228, 228, 234)",
          }}
        />
        <div
          style={{
            ...lineBase,
            width: "40%",
            background: "rgb(196, 196, 203)",
            marginTop: "auto",
          }}
        />
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{
        width: "18px",
        height: "18px",
        minWidth: "18px",
        minHeight: "18px",
        flexShrink: 0,
        display: "block",
        color: "#7c53ff",
      }}
      className="doc-ui-icon doc-search-icon"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.2 16.2 21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{
        width: "18px",
        height: "18px",
        minWidth: "18px",
        minHeight: "18px",
        flexShrink: 0,
        display: "block",
      }}
      className="doc-ui-icon"
      aria-hidden="true"
    >
      <path
        d="m7 9 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{
        width: "18px",
        height: "18px",
        minWidth: "18px",
        minHeight: "18px",
        flexShrink: 0,
        display: "block",
      }}
      className="doc-ui-icon"
      aria-hidden="true"
    >
      <path
        d="m7 15 5-5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      style={{
        width: "14px",
        height: "14px",
        minWidth: "14px",
        minHeight: "14px",
        flexShrink: 0,
        display: "block",
      }}
      className="doc-tiny-icon"
      aria-hidden="true"
    >
      <path
        d="M9 18l6-6-6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function UsefulDocumentTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [docType, setDocType] = useState("All Documents");
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsDocDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((item) => {
      const categoryMatch =
        activeCategory === "All Templates" || item.category === activeCategory;

      let docTypeMatch = true;
      if (docType === "General document") {
        docTypeMatch = !item.stamp;
      } else if (docType === "Stamp document") {
        docTypeMatch = item.stamp === true;
      }

      const queryMatch =
        !query ||
        `${item.title} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(query);

      return categoryMatch && docTypeMatch && queryMatch;
    });
  }, [activeCategory, docType, search]);

  const toggleFaq = (id: number) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSearch("");
    setActiveCategory("All Templates");
    setDocType("All Documents");
  };

  return (
    <>
      <main className="documents-page">
        <style>{`
          .documents-page {
            --page-bg: #f5f5f7;
            --hero-bg: #f8f8fb;
            --card-border: #e8e8ec;
            --muted: #8c8e96;
            --text: #121316;
            --orange: #d86c00;
            --orange-deep: #ed8507;
            --pink: #d54e90;
            --chip-bg: #eff0f3;
            min-height: 100vh;
            background: var(--page-bg);
            color: var(--text);
            font-family:
              Inter,
              ui-sans-serif,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Arial,
              sans-serif;
            -webkit-font-smoothing: antialiased;
          }

          .documents-page *,
          .documents-page *::before,
          .documents-page *::after {
            box-sizing: border-box;
          }

          .documents-page button,
          .documents-page input {
            font: inherit;
          }

          .documents-page button {
            border: 0;
          }

          .hero {
            min-height: 307px;
            padding: 40px 20px 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background:
              radial-gradient(
                circle at 24% 78%,
                rgba(151, 153, 255, 0.15),
                transparent 34%
              ),
              radial-gradient(
                circle at 84% 83%,
                rgba(244, 189, 101, 0.18),
                transparent 31%
              ),
              linear-gradient(180deg, #f8f8fb 0%, #f7f7fb 100%);
            border-top: 1px solid #e9e9ed;
            border-bottom: 1px solid #e1e1e6;
          }

          .hero-inner {
            width: min(100%, 1040px);
            margin: 0 auto;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 0 18px;
            border: 1px solid #e4a322;
            color: #b96f00;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.48);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: -0.1px;
          }

          .hero h1 {
            margin: 18px 0 13px;
            font-size: clamp(38px, 3.6vw, 49px);
            line-height: 1.05;
            letter-spacing: -2px;
            font-weight: 800;
          }

          .hero h1 span {
            color: var(--orange-deep);
          }

          .hero-copy {
            width: min(100%, 710px);
            margin: 0 auto;
            font-size: 16px;
            line-height: 1.55;
            color: #53545b;
            letter-spacing: -0.25px;
          }

          .search-row {
            margin: 20px auto 0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .search-box {
            height: 49px;
            border-radius: 999px;
            background: #fff;
            border: 1px solid #dadce1;
            box-shadow:
              0 1px 2px rgba(0, 0, 0, 0.02),
              inset 0 0 0 1px rgba(255, 255, 255, 0.7);
            width: min(100%, 372px);
            display: flex;
            align-items: center;
            padding: 0 14px 0 19px;
          }

          .search-box input {
            width: 100%;
            min-width: 0;
            border: 0;
            outline: none;
            background: transparent;
            color: #2d2e33;
            font-size: 15px;
          }

          .search-box input::placeholder {
            color: #a1a2a7;
          }

          .kbd {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 23px;
            min-width: 36px;
            padding: 0 8px;
            margin: 0 9px 0 10px;
            border-radius: 6px;
            background: #f3efff;
            border: 1px solid #d8d0ff;
            color: #8a7cf0;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
          }

          .select-wrapper {
            position: relative;
            display: inline-block;
          }

          .select-box {
            height: 49px;
            border-radius: 999px;
            background: #fff;
            border: 1px solid #dadce1;
            box-shadow:
              0 1px 2px rgba(0, 0, 0, 0.02),
              inset 0 0 0 1px rgba(255, 255, 255, 0.7);
            min-width: 175px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 0 16px 0 20px;
            color: #1f2024;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: border-color 0.15s ease;
          }

          .select-box:hover {
            border-color: #c5c8d0;
          }

          .dropdown-overlay {
            position: fixed;
            inset: 0;
            z-index: 40;
          }

          .doc-dropdown {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            z-index: 50;
            width: 220px;
            animation: dropdownFadeIn 0.15s ease-out;
          }

          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dropdown-arrow {
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
            background: #ffffff;
            border-radius: 2px;
            box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.03);
            z-index: 2;
          }

          .dropdown-menu {
            position: relative;
            background: #ffffff;
            border-radius: 16px;
            padding: 6px;
            box-shadow:
              0 12px 32px rgba(0, 0, 0, 0.12),
              0 2px 6px rgba(0, 0, 0, 0.04);
            display: flex;
            flex-direction: column;
            gap: 2px;
            z-index: 1;
          }

          .dropdown-item {
            width: 100%;
            height: 44px;
            padding: 0 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: transparent;
            color: #2d2e33;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: left;
          }

          .dropdown-item:hover:not(.selected) {
            background: #f4f4f7;
            color: #111;
          }

          .dropdown-item.selected {
            background: #7c53ff;
            color: #ffffff;
          }

          .check-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
          }

          .select-label {
            white-space: nowrap;
          }

          .filter-bar {
            background: #fff;
            border-bottom: 1px solid #dedfe3;
            min-height: 38px;
            display: flex;
            align-items: center;
          }

          .filter-inner {
            width: min(100%, 1050px);
            padding: 7px 16px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .filter-inner::-webkit-scrollbar {
            display: none;
          }

          .filter-chip {
            flex: 0 0 auto;
            min-height: 26px;
            padding: 0 14px;
            border-radius: 999px;
            background: var(--chip-bg);
            color: #4a4b50;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: 0.15s ease;
          }

          .filter-chip:hover {
            transform: translateY(-1px);
          }

          .filter-chip.active {
            color: #fff;
            background: linear-gradient(
              90deg,
              #ff9e09 0%,
              #ef8b0a 48%,
              #c95596 100%
            );
            box-shadow: 0 3px 7px rgba(225, 129, 26, 0.18);
          }

          .grid-shell {
            width: min(100%, 1180px);
            margin: 0 auto;
            padding: 29px 16px 72px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
          }

          .card {
            min-width: 0;
            overflow: hidden;
            border: 1px solid #dedfe3;
            border-radius: 16px;
            background: #ffffff;
            box-shadow:
              0 1px 3px rgba(18, 19, 22, 0.03),
              0 6px 16px rgba(18, 19, 22, 0.035);
            transition:
              transform 0.18s ease,
              box-shadow 0.18s ease;
          }

          .card:hover {
            transform: translateY(-2px);
            box-shadow:
              0 4px 10px rgba(18, 19, 22, 0.05),
              0 12px 26px rgba(18, 19, 22, 0.07);
          }

          .preview {
            position: relative;
            height: 155px;
            overflow: hidden;
            isolation: isolate;
            display: grid;
            place-items: center;
            background: #f1ede7;
          }

          .document-preview-paper-wrap {
            position: absolute;
            inset: 0;
            z-index: 2;
            display: grid;
            place-items: center;
            pointer-events: none;
          }

          .document-preview-paper {
            box-sizing: border-box;
          }

          .stamp {
            position: absolute;
            z-index: 4;
            right: 10px;
            top: 9px;
            min-width: 64px;
            height: 25px;
            padding: 0 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            border-radius: 999px;
            background: linear-gradient(180deg, #ffae18, #ef8805);
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            box-shadow: 0 3px 7px rgba(191, 111, 0, 0.25);
          }

          .stamp-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.92);
            position: relative;
          }

          .stamp-dot::after {
            content: "";
            position: absolute;
            inset: 1px;
            border: 1px solid rgba(255, 255, 255, 0.82);
            border-radius: 50%;
          }

          .card-body {
            min-height: 171px;
            padding: 14px 14px 13px;
            display: flex;
            flex-direction: column;
          }

          .category {
            margin-bottom: 7px;
            color: #858891;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .title {
            color: #111216;
            font-size: 13px;
            line-height: 1.35;
            font-weight: 800;
            letter-spacing: -0.2px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .description {
            margin-top: 7px;
            color: #686a72;
            font-size: 12px;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-footer {
            margin-top: auto;
            padding-top: 11px;
            border-top: 1px solid #ededf0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .details {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            color: #d86c00;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .details:hover {
            color: #b55a00;
          }

          .file-types {
            color: #8c8e96;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2px;
          }

          .empty-state {
            grid-column: 1 / -1;
            border: 1px dashed #d6d6db;
            border-radius: 14px;
            padding: 46px 18px;
            text-align: center;
            background: #fafafa;
            color: #7f8087;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }

          .reset-btn {
            padding: 8px 18px;
            border-radius: 999px;
            background: #7c53ff;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s ease;
          }

          .reset-btn:hover {
            background: #683ee3;
          }

          .faq-section {
            padding: 60px 16px 84px;
            background: linear-gradient(180deg, #f8f8fb 0%, #f1f1f5 100%);
            border-top: 1px solid #e3e3e8;
          }

          .faq-inner {
            width: min(100%, 780px);
            margin: 0 auto;
            text-align: center;
          }

          .faq-eyebrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 26px;
            padding: 0 16px;
            border: 1px solid #e4a322;
            color: #b96f00;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.6);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: -0.1px;
          }

          .faq-title {
            margin: 18px 0 12px;
            font-size: clamp(30px, 3.8vw, 48px);
            line-height: 1.1;
            letter-spacing: -1.8px;
            font-weight: 800;
            color: #0c0c0e;
          }

          .faq-title span {
            color: var(--orange-deep);
          }

          .faq-subtitle {
            font-size: 15px;
            color: #63646b;
            margin: 0 0 36px;
            letter-spacing: -0.2px;
          }

          .faq-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-align: left;
          }

          .faq-item {
            background: #ffffff;
            border: 1px solid #e5e6eb;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.015);
            transition:
              border-color 0.15s ease,
              box-shadow 0.15s ease;
          }

          .faq-item.open {
            border-color: #d2d4dc;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          }

          .faq-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: transparent;
            cursor: pointer;
            text-align: left;
            gap: 16px;
          }

          .faq-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .faq-num {
            font-size: 13px;
            font-weight: 700;
            color: #b5b6be;
            min-width: 22px;
          }

          .faq-question {
            font-size: 14px;
            font-weight: 700;
            color: #1a1b1e;
            letter-spacing: -0.1px;
          }

          .faq-icon-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f4f4f7;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c6d75;
            flex-shrink: 0;
            transition: background 0.15s ease;
          }

          .faq-item:hover .faq-icon-btn {
            background: #eaeaf0;
          }

          .faq-answer {
            padding: 0 20px 18px 58px;
            font-size: 13px;
            line-height: 1.6;
            color: #55565e;
            animation: faqFadeIn 0.18s ease-out;
          }

          @keyframes faqFadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .whatsapp {
            position: fixed;
            right: 22px;
            bottom: 22px;
            width: 53px;
            height: 53px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #27d36a;
            color: #fff;
            box-shadow: 0 99px 25px rgba(37, 211, 102, 0.3);
            z-index: 20;
            text-decoration: none;
            transition: transform 0.15s ease;
          }

          .whatsapp:hover {
            transform: scale(1.06);
          }

          .whatsapp svg {
            width: 27px;
            height: 27px;
          }

          @media (max-width: 1060px) {
            .grid-shell {
              padding-left: 20px;
              padding-right: 20px;
            }
            .grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
            .filter-inner {
              padding-left: 20px;
              padding-right: 20px;
            }
          }

          @media (max-width: 760px) {
            .hero {
              min-height: 330px;
              padding: 50px 18px 44px;
            }

            .hero h1 {
              font-size: 39px;
              letter-spacing: -1.7px;
            }

            .hero-copy {
              font-size: 15px;
            }

            .grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .whatsapp {
              right: 16px;
              bottom: 16px;
              width: 49px;
              height: 49px;
            }

            .faq-answer {
              padding-left: 20px;
            }
          }

          @media (max-width: 520px) {
            .search-row {
              align-items: stretch;
            }
            .search-box,
            .select-wrapper,
            .select-box {
              width: 100%;
            }
            .doc-dropdown {
              width: 100%;
            }
            .grid-shell {
              padding-top: 25px;
              padding-left: 12px;
              padding-right: 12px;
            }
            .grid {
              gap: 12px;
              grid-template-columns: 1fr;
            }
            .hero h1 {
              font-size: 35px;
            }
            .card-body {
              min-height: 150px;
            }
          }
        `}</style>

        <section className="hero">
          <div className="hero-inner">
            <div className="eyebrow">50+ Document Templates</div>
            <h1>
              Essential <span>Document</span> Templates
            </h1>
            <p className="hero-copy">
              Agreements, deeds, applications and many more essential document
              templates. Choose any template and create it instantly in the
              SohozKaj app.
            </p>

            <div className="search-row">
              <label className="search-box">
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents... (e.g., agreement)"
                  aria-label="Find documents"
                />
                <span className="kbd">Ctrl K</span>
                <SearchIcon />
              </label>

              <div className="select-wrapper">
                <button
                  type="button"
                  className="select-box"
                  aria-expanded={isDocDropdownOpen}
                  aria-label="Select document type"
                  onClick={() => setIsDocDropdownOpen((prev) => !prev)}
                >
                  <span className="select-label">{docType}</span>
                  {isDocDropdownOpen ? <ChevronUp /> : <ChevronDown />}
                </button>

                {isDocDropdownOpen && (
                  <>
                    <div
                      className="dropdown-overlay"
                      onClick={() => setIsDocDropdownOpen(false)}
                    />
                    <div className="doc-dropdown">
                      <div className="dropdown-arrow" />
                      <div className="dropdown-menu" role="listbox">
                        {docTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            role="option"
                            aria-selected={docType === type}
                            className={`dropdown-item ${docType === type ? "selected" : ""}`}
                            onClick={() => {
                              setDocType(type);
                              setIsDocDropdownOpen(false);
                            }}
                          >
                            <span>{type}</span>
                            {docType === type && (
                              <svg
                                viewBox="0 0 24 24"
                                className="check-icon"
                                aria-hidden="true"
                              >
                                <path
                                  d="M20 6L9 17l-5-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <nav className="filter-bar" aria-label="Document categories">
          <div className="filter-inner">
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-chip ${activeCategory === category ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
                type="button"
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>

        <section className="grid-shell">
          <div className="grid">
            {visibleTemplates.map((item) => (
              <article className="card" key={item.id}>
                <div
                  className="preview"
                  style={{
                    position: "relative",
                    height: "155px",
                    overflow: "hidden",
                    isolation: "isolate",
                    display: "grid",
                    placeItems: "center",
                    background: "#f1ede7",
                  }}
                >
                  <DocumentIcon />
                  {item.stamp ? (
                    <span className="stamp">
                      <span className="stamp-dot" />
                      Stamp
                    </span>
                  ) : null}
                </div>

                <div className="card-body">
                  <div className="category">{item.category}</div>
                  <div className="title">{item.title}</div>
                  <div className="description">{item.description}</div>

                  <div className="card-footer">
                    <a
                      className="details"
                      href="#details"
                      onClick={(e) => e.preventDefault()}
                    >
                      <span>See details</span>
                      <ArrowRight />
                    </a>
                    <span className="file-types">
                      PDF&nbsp;&nbsp;·&nbsp;&nbsp;DOCX
                    </span>
                  </div>
                </div>
              </article>
            ))}

            {visibleTemplates.length === 0 ? (
              <div className="empty-state">
                <p>No matching document templates found.</p>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="faq-inner">
            <div className="faq-eyebrow">FAQ</div>
            <h2 className="faq-title">
              General inquiries<span>(FAQ)</span>
            </h2>
            <p className="faq-subtitle">
              Answers to the most frequently asked questions about useful
              document templates.
            </p>

            <div className="faq-list">
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`faq-item ${isOpen ? "open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-header"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${faq.id}`}
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <div className="faq-left">
                        <span className="faq-num">{faq.num}</span>
                        <span className="faq-question">{faq.question}</span>
                      </div>
                      <div className="faq-icon-btn">
                        {isOpen ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </button>
                    {isOpen && (
                      <div id={`faq-answer-${faq.id}`} className="faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp"
          aria-label="Contact us on WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="8.7"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8.4 18.6 7.4 21l2.4-1.1A8.7 8.7 0 1 0 8.4 18.6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9.1 9.2c.15-.34.32-.35.6-.35h.45c.2 0 .34.1.42.32l.62 1.45c.08.2.04.38-.08.54l-.4.5c-.11.13-.12.25-.04.4.33.6 1.2 1.54 2.36 1.98.19.08.3.05.41-.07l.55-.67c.13-.16.3-.2.49-.1l1.39.65c.2.1.27.23.24.45-.05.39-.33 1.04-.91 1.34-.48.25-1.24.22-2.1-.13-.73-.3-1.61-.88-2.54-1.75-.77-.73-1.56-1.77-1.91-2.48-.32-.64-.38-1.2-.18-1.64Z"
              fill="currentColor"
            />
          </svg>
        </a>
      </main>
      <Footer />
    </>
  );
}
