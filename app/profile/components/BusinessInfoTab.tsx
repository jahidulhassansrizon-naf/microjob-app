import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Loader2, Save, Store } from "lucide-react";
import { InputField } from "./FormFields";

export type BusinessFormData = {
  businessName: string;
  businessType: string;
  tradeLicense: string;
  businessPhone: string;
  businessAddress: string;
  website: string;
};

type BusinessInfo = {
  businessName?: string;
  businessType?: string;
  tradeLicense?: string;
  businessPhone?: string;
  businessAddress?: string;
  website?: string;
};

export default function BusinessInfoTab({
  business,
  businessForm,
  setBusinessForm,
  savingBusiness,
  onSubmit,
}: {
  business: BusinessInfo;
  businessForm: BusinessFormData;
  setBusinessForm: Dispatch<SetStateAction<BusinessFormData>>;
  savingBusiness: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <Store size={17} className="text-amber-500" />
          Shop / Business Information
        </div>

        <button
          type="submit"
          disabled={savingBusiness}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          {savingBusiness ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}

          {savingBusiness ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Business Name"
          value={businessForm.businessName}
          onChange={(value) =>
            setBusinessForm((previous) => ({
              ...previous,
              businessName: value,
            }))
          }
          placeholder="Enter business name"
        />

        <InputField
          label="Business Type"
          value={businessForm.businessType}
          onChange={(value) =>
            setBusinessForm((previous) => ({
              ...previous,
              businessType: value,
            }))
          }
          placeholder="e.g. Retail, Agency, Shop"
        />

        <InputField
          label="Trade License"
          value={businessForm.tradeLicense}
          onChange={(value) =>
            setBusinessForm((previous) => ({
              ...previous,
              tradeLicense: value,
            }))
          }
          placeholder="Enter trade license number"
        />

        <InputField
          label="Business Phone"
          value={businessForm.businessPhone}
          onChange={(value) =>
            setBusinessForm((previous) => ({
              ...previous,
              businessPhone: value,
            }))
          }
          placeholder="Enter business phone"
          type="tel"
        />

        <InputField
          label="Website"
          value={businessForm.website}
          onChange={(value) =>
            setBusinessForm((previous) => ({
              ...previous,
              website: value,
            }))
          }
          placeholder="https://example.com"
          type="url"
        />

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Business Address
          </label>

          <textarea
            rows={4}
            value={businessForm.businessAddress}
            onChange={(event) =>
              setBusinessForm((previous) => ({
                ...previous,
                businessAddress: event.target.value,
              }))
            }
            placeholder="Enter complete business address"
            className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {!business.businessName && (
        <p className="text-[11px] text-gray-400">
          Business information is empty right now. Add your shop/business
          details above.
        </p>
      )}
    </form>
  );
}
