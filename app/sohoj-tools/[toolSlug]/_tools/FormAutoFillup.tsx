"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Settings,
  Search,
  ChevronLeft,
  Briefcase,
  Sparkles,
  MoreVertical,
  User,
  FileText,
  Image as ImageIcon,
  ClipboardList,
  Pin,
} from "lucide-react";

// Tab Components
import BasicInfoTab, {
  BasicInfoData,
} from "@/components/formAutofillupComponent/BasicInfoTab";
import DetailsTab, {
  DetailsData,
} from "@/components/formAutofillupComponent/DetailsTab";
import PhotoSignatureTab, {
  PhotoSignatureData,
} from "@/components/formAutofillupComponent/PhotoSignatureTab";
import AdditionalInfoTab from "@/components/formAutofillupComponent/AdditionalInfoTab";
import FormsListTable from "@/components/formAutofillupComponent/FormsListTable";

export interface FormDataItem {
  id: string;
  basic: BasicInfoData;
  details: DetailsData;
  photoSignature: PhotoSignatureData;
  additional: Record<number, string>;
  createdAt: string;
}

// Initial Form Values
const initialBasicInfo: BasicInfoData = {
  mobileNumber: "",
  applicantNameBangla: "",
  applicantNameEnglish: "",
};

const initialDetailsData: DetailsData = {
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

const initialPhotoSignatureData: PhotoSignatureData = {
  photoUrl: null,
  signatureUrl: null,
};

const initialAdditionalInfoData: Record<number, string> = {};

export default function FormAutoFillup() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "basic" | "details" | "photo" | "additional"
  >("basic");

  // Forms List State & Loading State
  const [formsList, setFormsList] = useState<FormDataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form State Management
  const [basicFormData, setBasicFormData] =
    useState<BasicInfoData>(initialBasicInfo);
  const [detailsFormData, setDetailsFormData] =
    useState<DetailsData>(initialDetailsData);
  const [photoSignatureFormData, setPhotoSignatureFormData] =
    useState<PhotoSignatureData>(initialPhotoSignatureData);
  const [additionalFormData, setAdditionalFormData] = useState<
    Record<number, string>
  >(initialAdditionalInfoData);

  // পেজ লোড হওয়ার সাথে সাথে MongoDB API থেকে ডেটা ফেচ করা
  useEffect(() => {
    fetchFormsFromMongo();
  }, []);

  const fetchFormsFromMongo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/saved-forms");
      const result = await response.json();

      if (response.ok && result.data) {
        const forms: FormDataItem[] = result.data.map((item: any) => ({
          id: item._id,
          basic: item.formData?.basic || initialBasicInfo,
          details: item.formData?.details || initialDetailsData,
          photoSignature:
            item.formData?.photoSignature || initialPhotoSignatureData,
          additional: item.formData?.additional || {},
          createdAt: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
        }));
        setFormsList(forms);
      }
    } catch (error) {
      console.error("Error fetching forms from MongoDB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Field change handlers
  const handleBasicInfoChange = (field: keyof BasicInfoData, value: string) => {
    setBasicFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDetailsInfoChange = (field: keyof DetailsData, value: any) => {
    setDetailsFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhotoSignatureChange = (
    field: keyof PhotoSignatureData,
    value: string | null,
  ) => {
    setPhotoSignatureFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAdditionalInfoChange = (id: number, value: string) => {
    setAdditionalFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Clear Form Handler
  const handleClearForm = () => {
    setBasicFormData(initialBasicInfo);
    setDetailsFormData(initialDetailsData);
    setPhotoSignatureFormData(initialPhotoSignatureData);
    setAdditionalFormData(initialAdditionalInfoData);
  };

  // Open Create Form View
  const handleOpenCreate = () => {
    setEditingId(null);
    handleClearForm();
    setIsCreating(true);
    setActiveTab("basic");
  };

  // Save / Create / Update Form Handler (MongoDB API Sync)
  const handleSaveForm = async () => {
    if (!basicFormData.applicantNameEnglish && !basicFormData.mobileNumber) {
      alert("Please fill at least Applicant Name or Mobile Number!");
      return;
    }

    try {
      const fullFormData = {
        basic: basicFormData,
        details: detailsFormData,
        photoSignature: photoSignatureFormData,
        additional: additionalFormData,
      };

      if (editingId) {
        // Update Form
        const response = await fetch(`/api/saved-forms?id=${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullFormData),
        });

        if (response.ok) {
          setFormsList((prev) =>
            prev.map((item) =>
              item.id === editingId
                ? {
                    ...item,
                    basic: basicFormData,
                    details: detailsFormData,
                    photoSignature: photoSignatureFormData,
                    additional: additionalFormData,
                  }
                : item,
            ),
          );
          alert("Form updated successfully!");
        } else {
          alert("Failed to update form.");
        }
      } else {
        // Create Form
        const response = await fetch("/api/saved-forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullFormData),
        });

        const result = await response.json();

        if (response.ok && result.data) {
          const newItem: FormDataItem = {
            id: result.data._id,
            basic: basicFormData,
            details: detailsFormData,
            photoSignature: photoSignatureFormData,
            additional: additionalFormData,
            createdAt: new Date().toLocaleDateString(),
          };
          setFormsList((prev) => [newItem, ...prev]);
          alert("Form created successfully!");
        } else {
          alert("Failed to save form.");
        }
      }

      setIsCreating(false);
      setEditingId(null);
      handleClearForm();
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save data!");
    }
  };

  // Edit Form Handler
  const handleEditForm = (item: FormDataItem) => {
    setEditingId(item.id);
    setBasicFormData(item.basic);
    setDetailsFormData(item.details);
    setPhotoSignatureFormData(item.photoSignature);
    setAdditionalFormData(item.additional);
    setIsCreating(true);
    setActiveTab("basic");
  };

  // Delete Form Handler (MongoDB API Sync)
  const handleDeleteForm = async (id: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        const response = await fetch(`/api/saved-forms?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setFormsList((prev) => prev.filter((item) => item.id !== id));
        } else {
          alert("Failed to delete form.");
        }
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Failed to delete form!");
      }
    }
  };

  // ==================== NEW FORM CREATION / EDIT VIEW ====================
  if (isCreating) {
    return (
      <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
        <div>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Back to Forms
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {editingId ? "Edit Form" : "New Form"}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Fill with AI
            </button>
            <button
              type="button"
              className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-500 transition-colors shadow-2xs"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "basic"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Basic Information
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "details"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "photo"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo & Signature
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("additional")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "additional"
                ? "bg-[#18181B] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Additional Information
          </button>
        </div>

        {activeTab === "basic" && (
          <BasicInfoTab
            formData={basicFormData}
            onChange={handleBasicInfoChange}
          />
        )}
        {activeTab === "details" && (
          <DetailsTab
            formData={detailsFormData}
            onChange={handleDetailsInfoChange}
            onSubmit={handleSaveForm}
            onCancel={() => setIsCreating(false)}
            onClear={handleClearForm}
            isEditing={!!editingId}
          />
        )}
        {activeTab === "photo" && (
          <PhotoSignatureTab
            formData={photoSignatureFormData}
            onChange={handlePhotoSignatureChange}
          />
        )}
        {activeTab === "additional" && (
          <AdditionalInfoTab
            formData={additionalFormData}
            onChange={handleAdditionalInfoChange}
          />
        )}

        {activeTab !== "details" && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50/50 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5 rotate-45" />
              Clear form
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="px-5 py-2 bg-[#E88000] text-white rounded-xl text-xs font-semibold hover:bg-[#d17300] transition-colors shadow-2xs cursor-pointer"
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN FORMS LIST VIEW ====================
  return (
    <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
      <div>
        <Link
          href="/sohoj-tools"
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to Tools
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Form auto fillup
            </h1>
            <p className="text-xs text-gray-500">
              Manage your job application forms and their data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-50 transition shadow-2xs cursor-pointer">
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            Settings
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E88000] text-white rounded-xl text-xs font-semibold hover:bg-[#d17300] transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create New Form
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2.5 shadow-2xs border border-gray-200/80">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or father's name..."
            className="w-full pl-9 pr-4 py-1 text-xs bg-transparent focus:outline-none placeholder-gray-400 text-gray-700"
          />
        </div>
      </div>

      {/* Forms List Table Component with isLoading prop */}
      <FormsListTable
        formsList={formsList}
        searchQuery={searchQuery}
        isLoading={isLoading}
        onOpenCreate={handleOpenCreate}
        onEditForm={(item: any) => handleEditForm(item)}
        onDeleteForm={handleDeleteForm}
      />
    </div>
  );
}
