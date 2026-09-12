import React from "react";
import { Asterisk } from "lucide-react";

export interface BasicInfoData {
  mobileNumber: string;
  applicantNameBangla: string;
  applicantNameEnglish: string;
}

interface BasicInfoTabProps {
  formData?: BasicInfoData;
  onChange?: (field: keyof BasicInfoData, value: string) => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData = {
    mobileNumber: "",
    applicantNameBangla: "",
    applicantNameEnglish: "",
  },
  onChange,
}) => {
  const handleChange = (field: keyof BasicInfoData, value: string) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
          <Asterisk className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">
          Required Information
        </h2>
      </div>

      {/* Form Input Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mobile Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.mobileNumber || ""}
            onChange={(e) => handleChange("mobileNumber", e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Applicant Name (Bangla) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700">
            Applicant Name (Bangla) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.applicantNameBangla || ""}
            onChange={(e) =>
              handleChange("applicantNameBangla", e.target.value)
            }
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Applicant Name (English) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700">
            Applicant Name (English) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.applicantNameEnglish || ""}
            onChange={(e) =>
              handleChange("applicantNameEnglish", e.target.value)
            }
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
