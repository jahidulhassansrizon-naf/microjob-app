"use client";

import { useParams } from "next/navigation";
import PrintMediaEditor from "../../PrintMediaEditor";
import { PRINT_MEDIA_TEMPLATES } from "../../templateCatalog";

export default function PrintMediaEditorPage() {
  const params = useParams();
  const rawId = params?.id;
  const templateId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  if (!Number.isInteger(templateId) || !PRINT_MEDIA_TEMPLATES.some((template) => template.id === templateId)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F3E9D2] p-6">
        <div className="rounded-2xl bg-white border border-[#E3D6B8] p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#3B2F1E]">Template not found</h1>
          <a href="/print-media" className="inline-flex mt-4 rounded-xl bg-[#DC2626] px-4 py-2 text-white font-bold">Back to Print Media</a>
        </div>
      </main>
    );
  }

  return <PrintMediaEditor templateId={templateId} />;
}
