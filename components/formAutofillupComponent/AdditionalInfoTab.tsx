import React from "react";
import { ClipboardList } from "lucide-react";

interface QuestionItem {
  id: number;
  label: string;
  type?: "select" | "text";
  options?: string[];
}

const questionsData: QuestionItem[] = [
  {
    id: 1,
    label:
      "Do you have minimum 10 (ten) years of professional experience in community finance and livelihood activities, including at least 6 (six) years of experience in livelihood activities under development projects?",
  },
  {
    id: 2,
    label:
      "Do you have minimum 07 (seven) years of professional experience in community finance and livelihood activities, including at least 4 (four) years of experience in livelihood activities under development projects?",
  },
  {
    id: 3,
    label:
      "Do you have minimum 07 (seven) years of work experience in finance and accounts management, including at least 4 (four) years of experience in accounting activities in development projects?",
  },
  {
    id: 4,
    label:
      "Do you have minimum 07 (seven) years of professional experience in environment and social safeguards, including at least 4 (four) experience in construction, environmental, and social safeguard-related activities in development projects?",
  },
  {
    id: 5,
    label: "Do you have experience in Community Finance?",
  },
  {
    id: 6,
    label: "Do you have experience in Livelihoods?",
  },
  {
    id: 7,
    label:
      "Do you have minimum 07 (seven) years of work experience in project monitoring, evaluation activities including at least 4 (four) years in development projects?",
  },
  {
    id: 8,
    label:
      "Do you have minimum 05 (five) years of work experience in project monitoring, evaluation activities in development projects?",
  },
  {
    id: 9,
    label:
      "Do you have minimum 05 (five) years of experience in development projects involving identification of ultra-poor and poor beneficiaries, group formation and organizational development, employment generation, credit operations, livelihood development and related activities?",
  },
  {
    id: 10,
    label:
      "Do you have experience in implementing activities such as identifying poor & extreme poor, providing capacity building training and experienced in employment creation including skill development in development projects?",
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
  {
    id: 14,
    label: "Do you have physical fitness for guard position?",
  },
  {
    id: 15,
    label: "Do you have practical experience in office cleaning?",
  },
  {
    id: 16,
    label: "Do you have a degree in science?",
  },
  {
    id: 17,
    label: "Do you have 03 years of experience in the relevant field?",
  },
  {
    id: 18,
    label: "Do you have knowledge of computer operation?",
  },
  {
    id: 19,
    label:
      "Do you have any experience in poverty alleviation/micro credit programmes of government/non-government organizations?",
  },
  {
    id: 20,
    label:
      "Do you have experience in computer and loan operations management in government, semi-government, autonomous and private organizations?",
  },
  {
    id: 21,
    label:
      "Do you have a valid driving license and at least 02 (two) years of practical experience?",
  },
  {
    id: 22,
    label:
      "Do you have minimum 15 (fifteen) years of service experience in the first grade position with 3 (three) years of experience in the position of Joint Director or equivalent (5th grade) in a government or autonomous institution?",
  },
  {
    id: 23,
    label:
      "Do you have 8 (eight) research publications in domestic or foreign journals?",
  },
  {
    id: 24,
    label:
      "Do you have minimum 12 (fifteen) years of service experience in the first grade position with 5 (three) years of experience in the position of Deputy Director or equivalent (6th grade) in a government or autonomous institution?",
  },
  {
    id: 25,
    label:
      "Do you have 6 (six) research publications in domestic or foreign journals?",
  },
  {
    id: 26,
    label:
      "Do you have 7 (seven) years of service experience (in 9th grade) in a government or autonomous institution as an Assistant Director or equivalent position?",
  },
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
      "Do you have 6 (six) months Computer Operation Certificate Course from an institution recognized by the Bangladesh Technical Education Board?",
  },
  {
    id: 32,
    label: "Do you have minimum 03 years experience job experience?",
  },
  {
    id: 33,
    label:
      "Do you have minimum speed of word processing, data entry and computer typing of 20 words in English and 20 words in Bangla per minute?",
  },
  {
    id: 34,
    label:
      "Do you have trade course certificate in mechanical from any recognized organization?",
  },
  {
    id: 35,
    label: "Are you in good health condition?",
  },
  {
    id: 36,
    label: "Do you have practical experience in related works?",
  },
  {
    id: 37,
    label:
      "Do you have minimum computer typing speed of 25 words in Bangla and 30 words in English per minute?",
  },
  {
    id: 38,
    label: "Do you have efficiencies in computer operation?",
  },
  {
    id: 39,
    label:
      "Do you have efficiencies and experience in Word Processing, Email on Computer, operating Fax machine etc?",
  },
  {
    id: 40,
    label: "Do you have valid light motor vehicle driving license?",
  },
  {
    id: 41,
    label:
      "Do you have experiences in Computer Operation including MS Word, Powerpoint and Excel?",
  },
  {
    id: 42,
    label: "Do you have Diploma in Silk Technology?",
  },
  {
    id: 43,
    label:
      "Do you have Trade Course certificate in Civil Drafting of duration of minimum 06 (six) months from any recognized institution?",
  },
  {
    id: 44,
    label: "Do you have a Light/Heavy Driving License?",
  },
  {
    id: 45,
    label: "Do you have a valid driving license?",
  },
  {
    id: 46,
    label:
      "Do you have minimum computer typing speed of 30 words in English and 25 words in Bangla per minute?",
  },
  {
    id: 47,
    label:
      "Do you have minimum Stenographer typing speed of 50 words in Bangla and 80 words in English per minute?",
  },
  {
    id: 48,
    label:
      "Do you need to have skills and experience in computer word processing, e-mail, fax machines, etc.?",
  },
  {
    id: 49,
    label:
      "Do you have minimum Stenographer typing speed of 45 words in Bangla and 70 words in English per minute?",
  },
  {
    id: 50,
    label:
      "Do you have training in computer operation and experience with word processing?",
  },
  {
    id: 51,
    label:
      "Do you have minimum computer typing speed of 20 words in Bangla and 28 words in English per minute?",
  },
  {
    id: 52,
    label: "What is your Harvey Driving License Number?",
    type: "text",
  },
];

interface AdditionalInfoTabProps {
  formData?: Record<number, string>;
  onChange?: (id: number, value: string) => void;
}

const AdditionalInfoTab: React.FC<AdditionalInfoTabProps> = ({
  formData = {},
  onChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
          <ClipboardList className="w-4 h-4 stroke-[2.5]" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">
          Additional Information
        </h2>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questionsData.map((q) => (
          <div
            key={q.id}
            className="p-4 border border-gray-200/80 rounded-2xl bg-white space-y-3 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 font-semibold text-[11px] rounded shrink-0 mt-0.5 min-w-[20px] text-center">
                {q.id}
              </span>
              <p className="text-xs font-medium text-gray-700 leading-relaxed">
                {q.label}
              </p>
            </div>

            {q.type === "text" ? (
              <div className="pl-7">
                <input
                  type="text"
                  value={formData[q.id] || ""}
                  onChange={(e) => onChange && onChange(q.id, e.target.value)}
                  className="w-full max-w-sm px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            ) : (
              <div className="pl-7">
                <select
                  value={formData[q.id] || ""}
                  onChange={(e) => onChange && onChange(q.id, e.target.value)}
                  className="w-full max-w-[200px] px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdditionalInfoTab;
