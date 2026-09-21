"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Link2,
  Megaphone,
} from "lucide-react";

interface JobsToolButtonsProps {
  onCreateAdvertisement: () => void;
  onUsefulLinks: () => void;
}

export default function JobsToolButtons({
  onCreateAdvertisement,
  onUsefulLinks,
}: JobsToolButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => router.push("/sohoj-tools/form-auto-fillup")}
        className="group flex h-[42px] min-w-[174px] items-center justify-between rounded-xl bg-[#F19A00] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#DF8C00]"
      >
        <span className="flex items-center gap-2">
          <FileText size={15} />
          Form Auto Fill-up
        </span>

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>

      <button
        type="button"
        onClick={onCreateAdvertisement}
        className="group flex h-[42px] min-w-[196px] items-center justify-between rounded-xl bg-[#97588D] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#864B7D]"
      >
        <span className="flex items-center gap-2">
          <Megaphone size={15} />
          Create Advertisement
        </span>

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>

      <button
        type="button"
        onClick={() => router.push("/sohoj-tools/age-calculator")}
        className="group flex h-[42px] min-w-[162px] items-center justify-between rounded-xl bg-[#2F805C] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#28704F]"
      >
        <span className="flex items-center gap-2">
          <CalendarDays size={15} />
          Age Calculator
        </span>

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>

      <button
        type="button"
        onClick={onUsefulLinks}
        className="group flex h-[42px] min-w-[148px] items-center justify-between rounded-xl bg-[#3A70A6] px-4 text-[11px] font-black text-white shadow-sm transition hover:bg-[#31618F]"
      >
        <span className="flex items-center gap-2">
          <Link2 size={15} />
          Useful Links
        </span>

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
}
