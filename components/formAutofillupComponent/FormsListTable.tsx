"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  User,
  Edit,
  Trash2,
  Copy,
  Check,
  Eye,
  Printer,
  Download,
  FolderMinus,
  Plus,
  X,
  FileText,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Info,
} from "lucide-react";

export interface BasicInfoData {
  mobileNumber?: string;
  applicantNameBangla?: string;
  applicantNameEnglish?: string;
}

export interface DetailsData {
  fatherNameEnglish?: string;
  fatherNameBangla?: string;
  motherNameEnglish?: string;
  motherNameBangla?: string;
  dob?: string;
  age?: string;
  gender?: string;
  religion?: string;
  nationality?: string;
  maritalStatus?: string;
  homeDistrict?: string;
  email?: string;
  nid?: string;
  birthRegNo?: string;
  passportId?: string;

  presentCo?: string;
  presentVillage?: string;
  presentPostOffice?: string;
  presentPostCode?: string;
  presentDistrict?: string;
  presentUpazila?: string;

  sameAsPresent?: boolean;
  permanentCo?: string;
  permanentVillage?: string;
  permanentPostOffice?: string;
  permanentPostCode?: string;
  permanentDistrict?: string;
  permanentUpazila?: string;

  quota?: string;
  departmentalStatus?: string;

  bloodGroup?: string;
  heightFeet?: string;
  heightInches?: string;
  weight?: string;
  chestNormal?: string;
  chestExpanded?: string;

  eduLevel?: string;
  examName?: string;
  rollNumber?: string;
  board?: string;
  groupSubject?: string;
  resultType?: string;
  result?: string;
  passingYear?: string;
  registrationNumber?: string;
  academicQualifications?: Array<{
    eduLevel?: string;
    examName?: string;
    rollNumber?: string;
    board?: string;
    groupSubject?: string;
    resultType?: string;
    result?: string;
    passingYear?: string;
    registrationNumber?: string;
  }>;

  employedOn?: string;
  orgName?: string;
  designation?: string;
  officeAddress?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  currentlyWorking?: boolean;
  jobDescription?: string;
  experiences?: Array<{
    employedOn?: string;
    orgName?: string;
    designation?: string;
    officeAddress?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
    currentlyWorking?: boolean;
    jobDescription?: string;
  }>;
}

export interface PhotoSignatureData {
  photoUrl?: string | null;
  signatureUrl?: string | null;
}

export interface AdditionalInfoData {
  [key: number]: string;
}

export interface FormDataItem {
  id: string;
  basic?: BasicInfoData;
  details?: DetailsData;
  photoSignature?: PhotoSignatureData;
  additionalInfo?: AdditionalInfoData;
}

interface FormsListTableProps {
  formsList: FormDataItem[];
  searchQuery: string;
  isLoading: boolean;
  onOpenCreate: () => void;
  onEditForm: (item: FormDataItem) => void;
  onDeleteForm: (id: string) => void;
}

const additionalQuestionsList = [
  {
    id: 1,
    label:
      "Do you have minimum 10 (ten) years of professional experience in community finance and livelihood activities...",
  },
  {
    id: 2,
    label:
      "Do you have minimum 07 (seven) years of professional experience in community finance and livelihood activities...",
  },
  {
    id: 3,
    label:
      "Do you have minimum 07 (seven) years of work experience in finance and accounts management...",
  },
  {
    id: 4,
    label:
      "Do you have minimum 07 (seven) years of professional experience in environment and social safeguards...",
  },
  { id: 5, label: "Do you have experience in Community Finance?" },
  { id: 6, label: "Do you have experience in Livelihoods?" },
  {
    id: 7,
    label:
      "Do you have minimum 07 (seven) years of work experience in project monitoring...",
  },
  {
    id: 8,
    label:
      "Do you have minimum 05 (five) years of work experience in project monitoring...",
  },
  {
    id: 9,
    label:
      "Do you have minimum 05 (five) years of experience in development projects...",
  },
  {
    id: 10,
    label:
      "Do you have experience in implementing activities such as identifying poor & extreme poor...",
  },
  {
    id: 11,
    label:
      "Do you have experience in construction work, environment & social safeguard-related activities?",
  },
  {
    id: 12,
    label:
      "Do you have minimum 06 months Diploma certificate in computer operation?",
  },
  {
    id: 13,
    label:
      "Do you have experience in MEL and data entry work in MIS software in development projects?",
  },
  { id: 14, label: "Do you have physical fitness for guard position?" },
  { id: 15, label: "Do you have practical experience in office cleaning?" },
  { id: 16, label: "Do you have a degree in science?" },
  {
    id: 17,
    label: "Do you have 03 years of experience in the relevant field?",
  },
  { id: 18, label: "Do you have knowledge of computer operation?" },
  {
    id: 19,
    label:
      "Do you have any experience in poverty alleviation/micro credit programmes...",
  },
  {
    id: 20,
    label:
      "Do you have experience in computer and loan operations management...",
  },
  {
    id: 21,
    label:
      "Do you have a valid driving license and at least 02 (two) years of practical experience?",
  },
  {
    id: 22,
    label: "Do you have minimum 15 (fifteen) years of service experience...",
  },
  {
    id: 23,
    label:
      "Do you have 8 (eight) research publications in domestic or foreign journals?",
  },
  {
    id: 24,
    label: "Do you have minimum 12 (fifteen) years of service experience...",
  },
  {
    id: 25,
    label:
      "Do you have 6 (six) research publications in domestic or foreign journals?",
  },
  { id: 26, label: "Do you have 7 (seven) years of service experience..." },
  {
    id: 27,
    label:
      "Do you have 4 (four) research publications in domestic or foreign journals?",
  },
  {
    id: 28,
    label: "Are you registered by Bangladesh Medical & Dental Council?",
  },
  {
    id: 29,
    label:
      "Do you have diploma in library science from any recognized institution?",
  },
  {
    id: 30,
    label: "Do you have Bachelor of Physical Education (BPEd) Degree?",
  },
  {
    id: 31,
    label:
      "Do you have 6 (six) months Computer Operation Certificate Course...",
  },
  { id: 32, label: "Do you have minimum 03 years experience job experience?" },
  { id: 33, label: "Do you have minimum speed of word processing..." },
  { id: 34, label: "Do you have trade course certificate in mechanical..." },
  { id: 35, label: "Are you in good health condition?" },
  { id: 36, label: "Do you have practical experience in related works?" },
  {
    id: 37,
    label: "Do you have minimum computer typing speed of 25 words in Bangla...",
  },
  { id: 38, label: "Do you have efficiencies in computer operation?" },
  {
    id: 39,
    label: "Do you have efficiencies and experience in Word Processing...",
  },
  { id: 40, label: "Do you have valid light motor vehicle driving license?" },
  {
    id: 41,
    label: "Do you have experiences in Computer Operation including MS Word...",
  },
  { id: 42, label: "Do you have Diploma in Silk Technology?" },
  {
    id: 43,
    label: "Do you have Trade Course certificate in Civil Drafting...",
  },
  { id: 44, label: "Do you have a Light/Heavy Driving License?" },
  { id: 45, label: "Do you have a valid driving license?" },
  {
    id: 46,
    label:
      "Do you have minimum computer typing speed of 30 words in English...",
  },
  {
    id: 47,
    label:
      "Do you have minimum Stenographer typing speed of 50 words in Bangla...",
  },
  {
    id: 48,
    label:
      "Do you need to have skills and experience in computer word processing...",
  },
  {
    id: 49,
    label:
      "Do you have minimum Stenographer typing speed of 45 words in Bangla...",
  },
  { id: 50, label: "Do you have training in computer operation..." },
  {
    id: 51,
    label: "Do you have minimum computer typing speed of 20 words in Bangla...",
  },
  { id: 52, label: "What is your Heavy Driving License Number?" },
];

export default function FormsListTable({
  formsList,
  searchQuery,
  isLoading,
  onOpenCreate,
  onEditForm,
  onDeleteForm,
}: FormsListTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<FormDataItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = (item: FormDataItem) => {
    setPreviewItem(item);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleDirectDownloadPDF = async (item: FormDataItem) => {
    setPreviewItem(item);

    setTimeout(async () => {
      if (pdfRef.current) {
        try {
          const html2canvas = (await import("html2canvas-pro")).default;
          const { jsPDF } = await import("jspdf");

          const originalHeight = pdfRef.current.style.height;
          const originalOverflow = pdfRef.current.style.overflow;
          pdfRef.current.style.height = "fit-content";
          pdfRef.current.style.overflow = "visible";

          const canvas = await html2canvas(pdfRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            height: pdfRef.current.scrollHeight,
            windowHeight: pdfRef.current.scrollHeight,
            windowWidth: pdfRef.current.scrollWidth,
          });

          pdfRef.current.style.height = originalHeight;
          pdfRef.current.style.overflow = originalOverflow;

          const imgData = canvas.toDataURL("image/jpeg", 0.98);
          const pdf = new jsPDF("p", "mm", "a4");

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfPageHeight = pdf.internal.pageSize.getHeight();

          const margin = 8;
          const printWidth = pdfWidth - margin * 2;
          const maxAvailableHeight = pdfPageHeight - margin * 2;
          let printHeight = (canvas.height * printWidth) / canvas.width;

          if (
            printHeight > maxAvailableHeight &&
            printHeight < maxAvailableHeight * 1.35
          ) {
            pdf.addImage(
              imgData,
              "JPEG",
              margin,
              margin,
              printWidth,
              maxAvailableHeight,
            );
          } else {
            let heightLeft = printHeight;
            let position = margin;

            pdf.addImage(
              imgData,
              "JPEG",
              margin,
              position,
              printWidth,
              printHeight,
            );
            heightLeft -= pdfPageHeight - margin * 2;

            let pageCount = 1;
            while (heightLeft > 0) {
              position = margin - pageCount * (pdfPageHeight - margin * 2);
              pdf.addPage();
              pdf.addImage(
                imgData,
                "JPEG",
                margin,
                position,
                printWidth,
                printHeight,
              );
              heightLeft -= pdfPageHeight - margin * 2;
              pageCount++;
            }
          }

          pdf.save(
            `${item.basic?.applicantNameEnglish || "application"}_form.pdf`,
          );
        } catch (error) {
          console.error("PDF generation error:", error);
        }
      }
    }, 350);
  };

  const filteredForms = formsList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const nameEng = item.basic?.applicantNameEnglish?.toLowerCase() || "";
    const nameBng = item.basic?.applicantNameBangla?.toLowerCase() || "";
    const phone = item.basic?.mobileNumber?.toLowerCase() || "";
    const father = item.details?.fatherNameEnglish?.toLowerCase() || "";
    return (
      nameEng.includes(q) ||
      nameBng.includes(q) ||
      phone.includes(q) ||
      father.includes(q)
    );
  });

  // Loading state UI
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center min-h-[320px] flex flex-col items-center justify-center shadow-2xs">
        <div className="w-8 h-8 border-4 border-[#E88000] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-gray-600">
          Loading saved forms...
        </p>
      </div>
    );
  }

  if (formsList.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center min-h-[320px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 text-gray-300">
          <FolderMinus className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          No forms created yet
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Create your first form to auto-fill job applications easily.
        </p>
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E88000] text-white rounded-xl text-xs font-semibold hover:bg-[#d17300] transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create New Form
        </button>
      </div>
    );
  }

  const academicList = previewItem?.details?.academicQualifications?.length
    ? previewItem.details.academicQualifications
    : previewItem?.details?.examName || previewItem?.details?.eduLevel
      ? [
          {
            eduLevel: previewItem.details.eduLevel,
            examName: previewItem.details.examName,
            rollNumber: previewItem.details.rollNumber,
            board: previewItem.details.board,
            groupSubject: previewItem.details.groupSubject,
            resultType: previewItem.details.resultType,
            result: previewItem.details.result,
            passingYear: previewItem.details.passingYear,
            registrationNumber: previewItem.details.registrationNumber,
          },
        ]
      : [];

  const experienceList = previewItem?.details?.experiences?.length
    ? previewItem.details.experiences
    : previewItem?.details?.orgName || previewItem?.details?.designation
      ? [
          {
            employedOn: previewItem.details.employedOn,
            orgName: previewItem.details.orgName,
            designation: previewItem.details.designation,
            officeAddress: previewItem.details.officeAddress,
            startDate: previewItem.details.startDate,
            endDate: previewItem.details.endDate,
            duration: previewItem.details.duration,
            currentlyWorking: previewItem.details.currentlyWorking,
            jobDescription: previewItem.details.jobDescription,
          },
        ]
      : [];

  const answeredAdditionalQuestions = additionalQuestionsList.filter(
    (q) => previewItem?.additionalInfo?.[q.id],
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          html,
          body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .modal-backdrop-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: transparent !important;
          }
          .printable-form-area,
          .printable-form-area * {
            visibility: visible;
          }
          .printable-form-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl relative">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            {filteredForms.length}{" "}
            {filteredForms.length === 1 ? "form" : "forms"}
          </span>
        </div>

        <div className="overflow-x-visible pb-24">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="py-3 px-6">Applicant Name</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Father's Name</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredForms.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors relative"
                  style={{
                    zIndex:
                      openMenuId === item.id
                        ? 50
                        : filteredForms.length - index,
                  }}
                >
                  <td className="py-4 px-6 font-semibold text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 overflow-hidden">
                      {item.photoSignature?.photoUrl ? (
                        <img
                          src={item.photoSignature.photoUrl}
                          alt="Photo"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p>
                        {item.basic?.applicantNameEnglish ||
                          "Unnamed Applicant"}
                      </p>
                      {item.basic?.applicantNameBangla && (
                        <p className="text-[11px] text-gray-400 font-normal">
                          {item.basic.applicantNameBangla}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span>{item.basic?.mobileNumber || "—"}</span>
                      {item.basic?.mobileNumber && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPhone(item.basic!.mobileNumber!, item.id)
                          }
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {item.details?.fatherNameEnglish || "—"}
                  </td>
                  <td className="py-4 px-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditForm(item)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <div
                        className="relative"
                        ref={openMenuId === item.id ? menuRef : null}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === item.id ? null : item.id,
                            )
                          }
                          className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[999999] py-1 text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setPreviewItem(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-amber-500" />
                              Preview form
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handlePrint(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4 text-purple-500" />
                              Print form
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDirectDownloadPDF(item);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-emerald-500" />
                              Download as PDF
                            </button>

                            <div className="h-px bg-gray-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDeleteForm(item.id);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {previewItem && (
          <div className="fixed inset-0 bg-black/60 z-[9999999] flex items-center justify-center p-2 sm:p-4 modal-backdrop-area">
            <div className="bg-[#f0f2f5] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between no-print shrink-0">
                <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Applicant Application Form —{" "}
                  {previewItem.basic?.applicantNameBangla ||
                    previewItem.basic?.applicantNameEnglish ||
                    "Applicant"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDirectDownloadPDF(previewItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E88000] hover:bg-[#d17300] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Form
                  </button>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center printable-form-area bg-[#f3f4f6]">
                <div
                  ref={pdfRef}
                  className="bg-white rounded-lg border border-gray-300 w-full max-w-4xl p-5 text-gray-800 space-y-4 shadow-sm font-sans h-fit text-[11px]"
                >
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="w-20 h-24 bg-gray-50 border border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {previewItem.photoSignature?.photoUrl ? (
                        <img
                          src={previewItem.photoSignature.photoUrl}
                          alt="Applicant Photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <User className="w-6 h-6 mx-auto mb-1 stroke-1" />
                          <span className="text-[8px]">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gray-900">
                        {previewItem.basic?.applicantNameBangla ||
                          previewItem.basic?.applicantNameEnglish ||
                          "—"}
                      </h1>
                      <p className="text-xs text-gray-500 font-medium">
                        {previewItem.basic?.applicantNameEnglish}
                      </p>
                      <p className="text-xs font-bold text-gray-700 mt-1">
                        Mobile: {previewItem.basic?.mobileNumber || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                        1. Personal Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#f9fafb] p-2.5 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Applicant's Name (English)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.basic?.applicantNameEnglish || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Applicant's Name (Bangla)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.basic?.applicantNameBangla || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Mobile Number
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.basic?.mobileNumber || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Father's Name (English)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.fatherNameEnglish || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Father's Name (Bangla)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.fatherNameBangla || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Mother's Name (English)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.motherNameEnglish || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Mother's Name (Bangla)
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.motherNameBangla || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Date of Birth
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.dob || "—"}{" "}
                          {previewItem.details?.age
                            ? `(${previewItem.details.age} yrs)`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Gender
                        </span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {previewItem.details?.gender || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Religion
                        </span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {previewItem.details?.religion || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Nationality
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.nationality || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Marital Status
                        </span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {previewItem.details?.maritalStatus || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Home District
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.homeDistrict || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Email
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.email || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          National ID
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.nid || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Birth Registration No.
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.birthRegNo || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Passport ID
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.passportId || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                        2. Address Details
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-[#f9fafb] p-3 rounded-lg border border-gray-200 space-y-1">
                        <span className="font-bold text-gray-800 border-b border-gray-200 pb-1 block">
                          Present Address
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              C/O
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentCo || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Village / Road / House
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentVillage || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Post Office
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentPostOffice || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Post Code
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentPostCode || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              District
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentDistrict || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Upazila
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.presentUpazila || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#f9fafb] p-3 rounded-lg border border-gray-200 space-y-1">
                        <span className="font-bold text-gray-800 border-b border-gray-200 pb-1 block">
                          Permanent Address
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              C/O
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentCo || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Village / Road / House
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentVillage || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Post Office
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentPostOffice || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Post Code
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentPostCode || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              District
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentDistrict || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px]">
                              Upazila
                            </span>
                            <span className="font-semibold text-gray-800">
                              {previewItem.details?.permanentUpazila || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                        3. Quota & Physical Measurement
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f9fafb] p-2.5 rounded-lg border border-gray-200">
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Quota
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.quota || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Departmental Status
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.departmentalStatus || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Blood Group
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.bloodGroup || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Height / Weight
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.heightFeet
                            ? `${previewItem.details.heightFeet}' ${previewItem.details.heightInches || 0}"`
                            : "—"}{" "}
                          {previewItem.details?.weight
                            ? `/ ${previewItem.details.weight}kg`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Chest — Normal
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.chestNormal
                            ? `${previewItem.details.chestNormal} inch`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">
                          Chest — Expanded
                        </span>
                        <span className="font-semibold text-gray-800">
                          {previewItem.details?.chestExpanded
                            ? `${previewItem.details.chestExpanded} inch`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                        Academic Qualification
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {academicList.length > 0 ? (
                        academicList.map((edu, idx) => (
                          <div
                            key={idx}
                            className="bg-[#f9fafb] border border-gray-200 rounded-lg p-3 relative space-y-2"
                          >
                            <span className="font-bold text-gray-600 block text-[10px]">
                              Qualification {idx + 1}
                            </span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Education Level:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.eduLevel || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Exam Name:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.examName || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Roll Number:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.rollNumber || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Board:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.board || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Group / Subject / Degree:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.groupSubject || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Result Type:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.resultType || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Result:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.result || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Passing Year:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.passingYear || "—"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500 text-[10px]">
                                  Registration Number:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {edu.registrationNumber || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic text-center py-2">
                          No academic qualification details.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                        Experience Information
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {experienceList.length > 0 ? (
                        experienceList.map((exp, idx) => (
                          <div
                            key={idx}
                            className="bg-[#f9fafb] border border-gray-200 rounded-lg p-3 relative space-y-2"
                          >
                            <span className="font-bold text-gray-600 block text-[10px]">
                              Experience {idx + 1}
                            </span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Employed On:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.employedOn || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Organization Name:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.orgName || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Designation:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.designation || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Office Address:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.officeAddress || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Start Date:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.startDate || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  End Date:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.endDate || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Duration:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.duration || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 text-[10px]">
                                  Currently Working:{" "}
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {exp.currentlyWorking ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500 text-[10px] block mb-0.5">
                                  Job Description:
                                </span>
                                <span className="font-semibold text-gray-800 block">
                                  {exp.jobDescription || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic text-center py-2">
                          No experience information added.
                        </p>
                      )}
                    </div>
                  </div>

                  {previewItem.additionalInfo &&
                    answeredAdditionalQuestions.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 border-b-2 border-amber-500 pb-0.5 mb-2">
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">
                            6. Additional Information Questions
                          </h3>
                        </div>
                        <div className="bg-[#f9fafb] p-2.5 rounded-lg border border-gray-200 space-y-1.5 text-[10px]">
                          {answeredAdditionalQuestions.map((q) => (
                            <div
                              key={q.id}
                              className="flex items-start justify-between border-b border-gray-100 pb-1 last:border-none"
                            >
                              <p className="text-gray-700 pr-3">
                                <span className="font-semibold text-gray-500 mr-1">
                                  Q{q.id}.
                                </span>
                                {q.label}
                              </p>
                              <span className="font-bold text-amber-800 bg-[#fef3c7] px-1.5 py-[0.5] rounded text-[10px] shrink-0">
                                {previewItem.additionalInfo![q.id]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="pt-4 flex items-end justify-between border-t border-gray-200 mt-2 text-[10px]">
                    <div>
                      <p className="text-gray-400">Printed Date:</p>
                      <p className="font-semibold text-gray-600">
                        {new Date().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-32 h-10 border-b border-gray-400 mb-1 flex items-center justify-center overflow-hidden">
                        {previewItem.photoSignature?.signatureUrl ? (
                          <img
                            src={previewItem.photoSignature.signatureUrl}
                            alt="Signature"
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">
                            [ Signature ]
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-700 block text-[10px]">
                        Applicant's Signature
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
