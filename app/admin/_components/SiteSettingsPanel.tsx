"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { ImagePlus, RefreshCw, Save, Globe, Phone, MapPin, Share2, CheckCircle2, AlertCircle, UploadCloud, Code2, Lightbulb, Plus, Trash2 } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/siteSettings";
import { getContactList, mergeSiteSettingsWithContactLists, type ContactListKey } from "@/app/_components/contactSettings";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";

const FIELD = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const LABEL = "block text-sm font-medium text-slate-700";

type GroupKey = keyof SiteSettings;
const getGroup = (settings: SiteSettings, key: GroupKey): Record<string, unknown> =>
  ((settings as unknown as Record<string, Record<string, unknown> | undefined>)[key] ?? {});
type FieldConfig = { key: string; label: string; hint?: string; type?: "url" | "email" | "tel" | "textarea" };

const GROUPS: { key: GroupKey; label: string; title: string; description: string; icon: typeof Globe; fields: FieldConfig[] }[] = [
  { key: "branding", label: "Branding", title: "Brand & website identity", description: "Change the public name, logo and browser/search title used across the site.", icon: Globe, fields: [
    { key: "siteName", label: "Website name" }, { key: "tagline", label: "Tagline" },
    { key: "logoUrl", label: "Main logo image URL", type: "url", hint: "Use a full HTTPS URL or a public path such as /sebalagbelogo/logo.png." },
    { key: "footerLogoUrl", label: "Footer banner image URL", type: "url" },
    { key: "metaTitle", label: "Browser / SEO title" }, { key: "metaDescription", label: "SEO description", type: "textarea" },
  ] },
  { key: "contact", label: "Contact information", title: "Shared contact details", description: "Manage the shared contact details used on the Contact page, help page, About page and legal-policy contact cards. Add or remove as many emails, phone numbers and locations as needed.", icon: Phone, fields: [
    { key: "phone", label: "Public phone number", type: "tel" }, { key: "email", label: "Public contact email", type: "email" },
    { key: "address", label: "Public address", type: "textarea" }, { key: "whatsapp", label: "WhatsApp number", type: "tel", hint: "Digits and country code are accepted; the Contact page can use this for WhatsApp links." },
    { key: "supportHours", label: "Support / working hours" },
  ] },
  { key: "contactPage", label: "Contact page", title: "Contact page content", description: "Edit the headline, call/email cards and visit/availability text separately from general contact information.", icon: MapPin, fields: [
    { key: "heroTitle", label: "Hero headline" }, { key: "heroSubtitle", label: "Hero introduction", type: "textarea" },
    { key: "contactPrompt", label: "Contact form introduction", type: "textarea" }, { key: "callDescription", label: "Phone card description" },
    { key: "emailDescription", label: "Email card description" }, { key: "officeTitle", label: "Workspace / office title" },
    { key: "officeDescription", label: "Workspace / office description", type: "textarea" }, { key: "visitNote", label: "Visit note", type: "textarea" },
    { key: "availabilityLabel", label: "Availability label" }, { key: "availabilityText", label: "Availability description", type: "textarea" },
    { key: "mapLabel", label: "Map button label" },
  ] },
  { key: "footer", label: "Footer", title: "Footer content", description: "Update the footer description and the copyright line without changing its layout.", icon: ImagePlus, fields: [
    { key: "description", label: "Footer description", type: "textarea" }, { key: "copyrightText", label: "Copyright text" },
  ] },
  { key: "developer", label: "Developer info", title: "Designer & developer details", description: "Shown in the first footer dropdown. These details are independent from Contact information; blank fields stay blank.", icon: Code2, fields: [
    { key: "title", label: "Dropdown title", hint: "For example: Designed & developed by" }, { key: "name", label: "Name" },
    { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone", type: "tel" },
    { key: "address", label: "Address", type: "textarea" },
  ] },
  { key: "partner", label: "Executive Profile", title: "Concept & operations partner details", description: "Shown in the second footer dropdown. The dropdown stays hidden on the live site until a name is saved.", icon: Lightbulb, fields: [
    { key: "title", label: "Dropdown title", hint: "For example: Concept & operations by" }, { key: "name", label: "Name" },
    { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone", type: "tel" },
    { key: "address", label: "Address", type: "textarea" },
  ] },
  { key: "aboutPage", label: "About page", title: "About page office blocks", description: "Edit the location labels and business identifiers shown in the About page office cards. The primary address and phone still use the shared Contact information section.", icon: MapPin, fields: [
    { key: "primaryOfficeLabel", label: "Primary office label" }, { key: "primaryOfficeLicense", label: "Primary office license number" },
    { key: "secondaryOfficeLabel", label: "Second office label" }, { key: "secondaryOfficeAddress", label: "Second office address", type: "textarea" },
    { key: "secondaryOfficePhone", label: "Second office phone" }, { key: "secondaryOfficeId", label: "Second office registration / ID" },
  ] },
  { key: "socials", label: "Social links", title: "Social media links", description: "Leave a link blank to keep that social profile unavailable.", icon: Share2, fields: [
    { key: "facebook", label: "Facebook URL", type: "url" }, { key: "tiktok", label: "TikTok URL", type: "url" },
    { key: "youtube", label: "YouTube URL", type: "url" }, { key: "instagram", label: "Instagram URL", type: "url" },
  ] },
];

function Field({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (value: string) => void }) {
  const shared = { id: `site-setting-${field.key}`, value, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), className: FIELD, placeholder: field.label };
  return <label className={LABEL} htmlFor={shared.id}>
    {field.label}
    {field.type === "textarea" ? <textarea {...shared} rows={3} className={`${FIELD} min-h-[88px] resize-y`} /> : <input {...shared} type={field.type || "text"} autoComplete="off" />}
    {field.hint && <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{field.hint}</span>}
  </label>;
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">{children}</section>;
}

function ContactListEditor({
  title,
  description,
  inputType,
  values,
  onChange,
}: {
  title: string;
  description: string;
  inputType: "email" | "tel" | "text";
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div><h4 className="text-sm font-semibold text-slate-800">{title}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
      <button type="button" onClick={() => onChange([...values, ""])} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"><Plus size={14}/> Add another</button>
    </div>
    <div className="space-y-2.5">
      {values.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">No items added. Use “Add another” to create one.</p>}
      {values.map((value, index) => <div key={`${title}-${index}`} className="flex items-center gap-2">
        <input type={inputType} value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`${title.replace(/s$/, "")} ${index + 1}`} className={FIELD}/>
        <button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`} title="Remove" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"><Trash2 size={15}/></button>
      </div>)}
    </div>
  </section>;
}

export default function SiteSettingsPanel() {
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("branding");
  const [draft, setDraft] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logoUrl" | "footerLogoUrl" | "">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { applySettings, refreshSettings } = useSiteSettings();
  const group = GROUPS.find((item) => item.key === selectedGroup) || GROUPS[0];

  const loadSettings = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/site-settings", { credentials: "include", cache: "no-store", headers: getClientAuthHeaders() });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.settings) throw new Error(data?.message || "Could not load site settings.");
      const value = mergeSiteSettingsWithContactLists<SiteSettings>(data.settings);
      setDraft(value);
      applySettings(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load site settings.");
    } finally { setLoading(false); }
  }, [applySettings]);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const updateField = (groupKey: GroupKey, fieldKey: string, value: string) => {
    setDraft((current) => {
      const next: SiteSettings = {
        ...current,
        [groupKey]: { ...getGroup(current, groupKey), [fieldKey]: value },
      } as SiteSettings;
      if (groupKey === "branding" && fieldKey === "siteName") {
        const oldName = current.branding.siteName.trim();
        const oldTitle = current.branding.metaTitle.trim();
        const newName = value.trim() || DEFAULT_SITE_SETTINGS.branding.siteName;
        const fallbackGeneratedTitle = `${DEFAULT_SITE_SETTINGS.branding.siteName} - ${current.branding.tagline}`;
        const currentGeneratedTitle = `${oldName || DEFAULT_SITE_SETTINGS.branding.siteName} - ${current.branding.tagline}`;
        const titleHasBrandPrefix = Boolean(oldName && oldTitle.startsWith(`${oldName} - `));
        const titleIsAutoGenerated = !oldTitle
          || oldTitle === currentGeneratedTitle
          || oldTitle === fallbackGeneratedTitle
          || titleHasBrandPrefix;

        if (titleIsAutoGenerated) {
          // Keep the existing tagline/custom suffix, but make the brand prefix
          // follow the website name even if the name field was cleared first.
          const separatorIndex = oldTitle.indexOf(" - ");
          const suffix = separatorIndex >= 0
            ? oldTitle.slice(separatorIndex)
            : ` - ${current.branding.tagline}`;
          next.branding.metaTitle = `${newName}${suffix}`;
        } else if (oldName && oldTitle.includes(oldName)) {
          next.branding.metaTitle = oldTitle.replaceAll(oldName, newName);
        }
      }
      return next;
    });
    setNotice("");
  };

  const updateContactList = (key: ContactListKey, values: string[]) => {
    setDraft((current) => {
      const contact = { ...getGroup(current, "contact"), [key]: values };
      if (key === "emails") contact.email = values.find((value) => value.trim())?.trim() ?? "";
      if (key === "phones") contact.phone = values.find((value) => value.trim())?.trim() ?? "";
      if (key === "locations") contact.address = values.find((value) => value.trim())?.trim() ?? "";
      return { ...current, contact } as SiteSettings;
    });
    setNotice("");
  };

  const getEditableContactList = (key: ContactListKey): string[] => {
    const value = getGroup(draft, "contact")[key];
    // Keep an in-progress blank row visible so the admin can type into it.
    return Array.isArray(value) ? value.map((item) => String(item ?? "")) : getContactList(draft.contact, key);
  };

  const uploadLogo = async (field: "logoUrl" | "footerLogoUrl", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(field); setError(""); setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/site-settings/logo-upload", { method: "POST", credentials: "include", headers: getClientAuthHeaders(), body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.url) throw new Error(data?.message || "Logo upload failed.");
      updateField("branding", field, data.url);
      setNotice(`${field === "logoUrl" ? "Main logo" : "Footer banner"} uploaded. Save changes to publish it.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed.");
    } finally { setUploading(""); }
  };

  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/site-settings", { method: "PUT", credentials: "include", headers: { ...getClientAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ settings: draft }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data.settings) throw new Error(data?.message || "Could not save changes.");
      const value = mergeSiteSettingsWithContactLists<SiteSettings>(data.settings);
      setDraft(value);
      applySettings(value);
      await refreshSettings();
      setNotice("Changes saved. Shared contact lists and the separate developer and executive details have been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="text-lg font-semibold tracking-tight text-slate-900">Website settings</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Manage shared site details from Admin instead of editing code. Changes are stored in the database and reused by connected components. Contact emails, phone numbers and locations can each have multiple entries.</p></div>
      <div className="flex gap-2">
        <button type="button" onClick={() => void loadSettings()} disabled={loading || saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Reload</button>
        <button type="button" onClick={() => void save()} disabled={loading || saving || Boolean(uploading)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={15}/>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>

    {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {notice && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}

    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Website settings sections" className="h-fit rounded-xl border border-slate-200 bg-white p-2">
        {GROUPS.map((item) => {
          const Icon = item.icon; const active = selectedGroup === item.key;
          return <button key={item.key} type="button" onClick={() => setSelectedGroup(item.key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}><Icon size={17}/><span>{item.label}</span></button>;
        })}
      </nav>
      <div className="min-w-0 space-y-4">
        <Card>
          <div className="mb-5"><h3 className="text-base font-semibold text-slate-900">{group.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p></div>
          {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading settings…</div> : <>
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.filter((field) => group.key !== "contact" || !["email", "phone", "address"].includes(field.key)).map((field) => <div key={`${group.key}-${field.key}`} className={field.type === "textarea" ? "md:col-span-2" : ""}><Field field={field} value={String(getGroup(draft, group.key)[field.key] ?? "")} onChange={(value) => updateField(group.key, field.key, value)} /></div>)}
            </div>
            {group.key === "contact" && <div className="mt-6 grid gap-4 xl:grid-cols-3">
              <ContactListEditor title="Contact emails" description="Every email is shown on contact-related site sections. The first email remains the default EmailJS recipient." inputType="email" values={getEditableContactList("emails")} onChange={(values) => updateContactList("emails", values)} />
              <ContactListEditor title="Contact phone numbers" description="Add as many public phone numbers as you need; each one appears as a clickable phone link." inputType="tel" values={getEditableContactList("phones")} onChange={(values) => updateContactList("phones", values)} />
              <ContactListEditor title="Contact locations" description="Add one or more public location/address entries. These are separate from the Executive Profile and Developer Info." inputType="text" values={getEditableContactList("locations")} onChange={(values) => updateContactList("locations", values)} />
            </div>}
          </>}
        </Card>
        {group.key === "branding" && !loading && <Card>
          <h3 className="text-base font-semibold text-slate-900">Logo preview & upload</h3><p className="mt-1 text-sm text-slate-500">Select a PNG, JPG, WEBP or AVIF file (maximum 5 MB). Cloudinary server settings are required for upload; a hosted image URL can also be entered above.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {([{ field: "logoUrl" as const, label: "Main logo" }, { field: "footerLogoUrl" as const, label: "Footer banner" }]).map((item) => <div key={item.field} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">{item.label}</div>
              <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-3"><img src={draft.branding[item.field] || (item.field === "logoUrl" ? "/sebalagbelogo/sebalagbelogo.png" : "/footerLogo/logoFooter.jpg")} alt={`${item.label} preview`} className="max-h-full max-w-full object-contain" /></div>
              <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><UploadCloud size={15}/>{uploading === item.field ? "Uploading…" : "Upload image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" disabled={Boolean(uploading)} onChange={(event) => void uploadLogo(item.field, event)} /></label>
            </div>)}
          </div>
        </Card>}
      </div>
    </div>
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">Changes affect connected site components after saving. Some wording in tool-generated content and transactional emails remains separately configured; contact details in the legal-policy cards use these shared contact lists.</div>
  </div>;
}
