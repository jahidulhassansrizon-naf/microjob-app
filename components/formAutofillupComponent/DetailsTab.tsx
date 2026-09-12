import React from "react";
import {
  User,
  MapPin,
  Award,
  Activity,
  GraduationCap,
  Briefcase,
  Plus,
  Calendar,
  Zap,
} from "lucide-react";

export interface DetailsData {
  // Basic Info
  fatherNameEnglish: string;
  fatherNameBangla: string;
  motherNameEnglish: string;
  motherNameBangla: string;
  dob: string;
  age: string;
  gender: string;
  religion: string;
  nationality: string;
  maritalStatus: string;
  homeDistrict: string;
  email: string;
  nid: string;
  birthRegNo: string;
  passportId: string;

  // Present Address
  presentCo: string;
  presentVillage: string;
  presentPostOffice: string;
  presentPostCode: string;
  presentDistrict: string;
  presentUpazila: string;

  // Permanent Address
  sameAsPresent: boolean;
  permanentCo: string;
  permanentVillage: string;
  permanentPostOffice: string;
  permanentPostCode: string;
  permanentDistrict: string;
  permanentUpazila: string;

  // Quota Info
  quota: string;
  departmentalStatus: string;

  // Physical Info
  bloodGroup: string;
  heightFeet: string;
  heightInches: string;
  weight: string;
  chestNormal: string;
  chestExpanded: string;

  // Academic Qualification
  eduLevel: string;
  examName: string;
  rollNumber: string;
  board: string;
  groupSubject: string;
  resultType: string;
  result: string;
  passingYear: string;
  registrationNumber: string;

  // Experience Info
  employedOn: string;
  orgName: string;
  designation: string;
  officeAddress: string;
  startDate: string;
  endDate: string;
  duration: string;
  currentlyWorking: boolean;
  jobDescription: string;
}

interface DetailsTabProps {
  formData?: DetailsData;
  onChange?: (field: keyof DetailsData, value: any) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  onClear?: () => void;
  isEditing?: boolean;
}

const defaultDetailsData: DetailsData = {
  fatherNameEnglish: "",
  fatherNameBangla: "",
  motherNameEnglish: "",
  motherNameBangla: "",
  dob: "",
  age: "",
  gender: "",
  religion: "",
  nationality: "",
  maritalStatus: "",
  homeDistrict: "",
  email: "",
  nid: "",
  birthRegNo: "",
  passportId: "",
  presentCo: "",
  presentVillage: "",
  presentPostOffice: "",
  presentPostCode: "",
  presentDistrict: "",
  presentUpazila: "",
  sameAsPresent: false,
  permanentCo: "",
  permanentVillage: "",
  permanentPostOffice: "",
  permanentPostCode: "",
  permanentDistrict: "",
  permanentUpazila: "",
  quota: "",
  departmentalStatus: "",
  bloodGroup: "",
  heightFeet: "",
  heightInches: "",
  weight: "",
  chestNormal: "",
  chestExpanded: "",
  eduLevel: "",
  examName: "",
  rollNumber: "",
  board: "",
  groupSubject: "",
  resultType: "",
  result: "",
  passingYear: "",
  registrationNumber: "",
  employedOn: "",
  orgName: "",
  designation: "",
  officeAddress: "",
  startDate: "",
  endDate: "",
  duration: "",
  currentlyWorking: false,
  jobDescription: "",
};

const DetailsTab: React.FC<DetailsTabProps> = ({
  formData = defaultDetailsData,
  onChange,
  onSubmit,
  onCancel,
  onClear,
  isEditing = false,
}) => {
  const handleChange = (field: keyof DetailsData, value: any) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  const handleSameAsPresentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const isChecked = e.target.checked;
    handleChange("sameAsPresent", isChecked);

    if (isChecked) {
      handleChange("permanentCo", formData.presentCo || "");
      handleChange("permanentVillage", formData.presentVillage || "");
      handleChange("permanentPostOffice", formData.presentPostOffice || "");
      handleChange("permanentPostCode", formData.presentPostCode || "");
      handleChange("permanentDistrict", formData.presentDistrict || "");
      handleChange("permanentUpazila", formData.presentUpazila || "");
    }
  };

  /* ==========================================================================
     [DEV ONLY] Auto-fill Dummy Data Function - Remove before production!
     ========================================================================== */
  const handleAutoFillDummyData = () => {
    if (!onChange) return;

    const mockData: Partial<DetailsData> = {
      fatherNameEnglish: "Md. Rafiqul Islam",
      fatherNameBangla: "মোঃ রফিকুল ইসলাম",
      motherNameEnglish: "Fatema Begum",
      motherNameBangla: "ফাতেমা বেগম",
      dob: "15/08/1996",
      age: "29",
      gender: "Male",
      religion: "Islam",
      nationality: "Bangladeshi",
      maritalStatus: "Single",
      homeDistrict: "Dhaka",
      email: "jahidul.dev@example.com",
      nid: "19962691234567890",
      birthRegNo: "199626912345678901234",
      passportId: "A01234567",

      presentCo: "Md. Rafiqul Islam",
      presentVillage: "House 45, Road 10, Block-B",
      presentPostOffice: "Mirpur",
      presentPostCode: "1216",
      presentDistrict: "Dhaka",
      presentUpazila: "",

      sameAsPresent: true,
      permanentCo: "Md. Rafiqul Islam",
      permanentVillage: "House 45, Road 10, Block-B",
      permanentPostOffice: "Mirpur",
      permanentPostCode: "1216",
      permanentDistrict: "Dhaka",
      permanentUpazila: "",

      quota: "Non Quota",
      departmentalStatus: "",

      bloodGroup: "B+",
      heightFeet: "5",
      heightInches: "8",
      weight: "68",
      chestNormal: "32",
      chestExpanded: "34",

      eduLevel: "Graduation",
      examName: "B.Sc in Software Engineering",
      rollNumber: "1801005",
      board: "Dhaka",
      groupSubject: "Computer Science",
      resultType: "CGPA",
      result: "3.75",
      passingYear: "",
      registrationNumber: "1801005099",

      employedOn: "",
      orgName: "SohozKaj Tech Ltd",
      designation: "Frontend Engineer",
      officeAddress: "Dhaka, Bangladesh",
      startDate: "01/01/2023",
      endDate: "12/12/2025",
      duration: "2 Years",
      currentlyWorking: true,
      jobDescription: "Developing modern Next.js web applications.",
    };

    Object.entries(mockData).forEach(([key, value]) => {
      onChange(key as keyof DetailsData, value);
    });
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Clean Human-Designed Floating Button */}
      <button
        type="button"
        onClick={handleAutoFillDummyData}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200/80 shadow-md rounded-xl text-xs font-semibold transition-all hover:border-amber-300 cursor-pointer"
        title="Auto-fill dummy data for testing"
      >
        <Zap className="w-3.5 h-3.5 text-amber-600" />
        <span>Auto Fill Data</span>
      </button>

      {/* 1. BASIC INFORMATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <User className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Father's Name (English)
            </label>
            <input
              type="text"
              value={formData.fatherNameEnglish || ""}
              onChange={(e) =>
                handleChange("fatherNameEnglish", e.target.value)
              }
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Father's Name (Bangla)
            </label>
            <input
              type="text"
              value={formData.fatherNameBangla || ""}
              onChange={(e) => handleChange("fatherNameBangla", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Mother's Name (English)
            </label>
            <input
              type="text"
              value={formData.motherNameEnglish || ""}
              onChange={(e) =>
                handleChange("motherNameEnglish", e.target.value)
              }
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Mother's Name (Bangla)
            </label>
            <input
              type="text"
              value={formData.motherNameBangla || ""}
              onChange={(e) => handleChange("motherNameBangla", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Date of Birth
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.dob || ""}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Age (Years)
            </label>
            <input
              type="text"
              value={formData.age || ""}
              onChange={(e) => handleChange("age", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Gender
            </label>
            <select
              value={formData.gender || ""}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Religion
            </label>
            <select
              value={formData.religion || ""}
              onChange={(e) => handleChange("religion", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Islam">Islam</option>
              <option value="Hinduism">Hinduism</option>
              <option value="Buddhism">Buddhism</option>
              <option value="Christianity">Christianity</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Nationality
            </label>
            <select
              value={formData.nationality || ""}
              onChange={(e) => handleChange("nationality", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Bangladeshi">Bangladeshi</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Marital Status
            </label>
            <select
              value={formData.maritalStatus || ""}
              onChange={(e) => handleChange("maritalStatus", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Home District
            </label>
            <select
              value={formData.homeDistrict || ""}
              onChange={(e) => handleChange("homeDistrict", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Dhaka">Dhaka</option>
              <option value="Chattogram">Chattogram</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              National ID
            </label>
            <input
              type="text"
              value={formData.nid || ""}
              onChange={(e) => handleChange("nid", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Birth Registration No.
            </label>
            <input
              type="text"
              value={formData.birthRegNo || ""}
              onChange={(e) => handleChange("birthRegNo", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Passport ID
            </label>
            <input
              type="text"
              value={formData.passportId || ""}
              onChange={(e) => handleChange("passportId", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. ADDRESS INFORMATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <MapPin className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">
            Address Information
          </h2>
        </div>

        {/* Present Address */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Present Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                C/O
              </label>
              <input
                type="text"
                value={formData.presentCo || ""}
                onChange={(e) => handleChange("presentCo", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Village / Road / House
              </label>
              <input
                type="text"
                value={formData.presentVillage || ""}
                onChange={(e) => handleChange("presentVillage", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Post Office
              </label>
              <input
                type="text"
                value={formData.presentPostOffice || ""}
                onChange={(e) =>
                  handleChange("presentPostOffice", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Post Code
              </label>
              <input
                type="text"
                value={formData.presentPostCode || ""}
                onChange={(e) =>
                  handleChange("presentPostCode", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                District
              </label>
              <select
                value={formData.presentDistrict || ""}
                onChange={(e) =>
                  handleChange("presentDistrict", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Upazila
              </label>
              <select
                value={formData.presentUpazila || ""}
                onChange={(e) => handleChange("presentUpazila", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
              </select>
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Permanent Address
            </h3>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sameAsPresent || false}
                onChange={handleSameAsPresentChange}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Same as present address
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                C/O
              </label>
              <input
                type="text"
                value={formData.permanentCo || ""}
                onChange={(e) => handleChange("permanentCo", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Village / Road / House
              </label>
              <input
                type="text"
                value={formData.permanentVillage || ""}
                onChange={(e) =>
                  handleChange("permanentVillage", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Post Office
              </label>
              <input
                type="text"
                value={formData.permanentPostOffice || ""}
                onChange={(e) =>
                  handleChange("permanentPostOffice", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Post Code
              </label>
              <input
                type="text"
                value={formData.permanentPostCode || ""}
                onChange={(e) =>
                  handleChange("permanentPostCode", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                District
              </label>
              <select
                value={formData.permanentDistrict || ""}
                onChange={(e) =>
                  handleChange("permanentDistrict", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Upazila
              </label>
              <select
                value={formData.permanentUpazila || ""}
                onChange={(e) =>
                  handleChange("permanentUpazila", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUOTA INFORMATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">Quota Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Quota
            </label>
            <select
              value={formData.quota || ""}
              onChange={(e) => handleChange("quota", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="Non Quota">Non Quota</option>
              <option value="Freedom Fighter">Freedom Fighter</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Departmental Status
            </label>
            <select
              value={formData.departmentalStatus || ""}
              onChange={(e) =>
                handleChange("departmentalStatus", e.target.value)
              }
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. PHYSICAL INFORMATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">
            Physical Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Blood Group
            </label>
            <select
              value={formData.bloodGroup || ""}
              onChange={(e) => handleChange("bloodGroup", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Height (Feet)
            </label>
            <input
              type="text"
              value={formData.heightFeet || ""}
              onChange={(e) => handleChange("heightFeet", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Height (Inches)
            </label>
            <input
              type="text"
              value={formData.heightInches || ""}
              onChange={(e) => handleChange("heightInches", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Weight (kg)
            </label>
            <input
              type="text"
              value={formData.weight || ""}
              onChange={(e) => handleChange("weight", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Chest - Normal (Inch)
            </label>
            <input
              type="text"
              value={formData.chestNormal || ""}
              onChange={(e) => handleChange("chestNormal", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Chest - Expanded (Inch)
            </label>
            <input
              type="text"
              value={formData.chestExpanded || ""}
              onChange={(e) => handleChange("chestExpanded", e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 5. ACADEMIC QUALIFICATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
              <GraduationCap className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">
              Academic Qualification
            </h2>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Qualification
          </button>
        </div>

        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-4">
          <p className="text-[10px] font-bold text-gray-400">Qualification 1</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Education Level
              </label>
              <select
                value={formData.eduLevel || ""}
                onChange={(e) => handleChange("eduLevel", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
                <option value="SSC">SSC / Equivalent</option>
                <option value="HSC">HSC / Equivalent</option>
                <option value="Graduation">Graduation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Exam Name
              </label>
              <input
                type="text"
                value={formData.examName || ""}
                onChange={(e) => handleChange("examName", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Roll Number
              </label>
              <input
                type="text"
                value={formData.rollNumber || ""}
                onChange={(e) => handleChange("rollNumber", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Board / University
              </label>
              <input
                type="text"
                value={formData.board || ""}
                onChange={(e) => handleChange("board", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Group / Subject / Degree
              </label>
              <input
                type="text"
                value={formData.groupSubject || ""}
                onChange={(e) => handleChange("groupSubject", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Result Type
              </label>
              <input
                type="text"
                value={formData.resultType || ""}
                onChange={(e) => handleChange("resultType", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Result
              </label>
              <input
                type="text"
                value={formData.result || ""}
                onChange={(e) => handleChange("result", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Passing Year
              </label>
              <select
                value={formData.passingYear || ""}
                onChange={(e) => handleChange("passingYear", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber || ""}
                onChange={(e) =>
                  handleChange("registrationNumber", e.target.value)
                }
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. EXPERIENCE INFORMATION SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
              <Briefcase className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">
              Experience Information
            </h2>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Experience
          </button>
        </div>

        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-4">
          <p className="text-[10px] font-bold text-gray-400">Experience 1</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Employed On
              </label>
              <select
                value={formData.employedOn || ""}
                onChange={(e) => handleChange("employedOn", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.orgName || ""}
                onChange={(e) => handleChange("orgName", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation || ""}
                onChange={(e) => handleChange("designation", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Office Address
              </label>
              <input
                type="text"
                value={formData.officeAddress || ""}
                onChange={(e) => handleChange("officeAddress", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Start Date
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={formData.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                End Date
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={formData.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Duration
              </label>
              <input
                type="text"
                value={formData.duration || ""}
                onChange={(e) => handleChange("duration", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Currently Working
              </label>
              <div className="flex items-center h-[34px] px-3.5 bg-white border border-gray-200 rounded-xl">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={formData.currentlyWorking || false}
                    onChange={(e) =>
                      handleChange("currentlyWorking", e.target.checked)
                    }
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Yes
                </label>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <label className="block text-xs font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                rows={3}
                value={formData.jobDescription || ""}
                onChange={(e) => handleChange("jobDescription", e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM ACTION BUTTONS */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 text-xs font-semibold text-rose-500 border border-rose-200 hover:bg-rose-50 bg-white rounded-xl transition cursor-pointer"
        >
          Clear form
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#E88000] hover:bg-[#d17300] rounded-xl transition shadow-xs cursor-pointer"
          >
            {isEditing ? "Update Form" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
