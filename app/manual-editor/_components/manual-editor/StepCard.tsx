"use client";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { ManualT as T } from "./manualEditorI18n";

/**
 * One numbered step of the editor ("1 · Upload", "2 · Size" ...). Every panel is
 * wrapped in one of these so a first-time user always sees the order of work,
 * what the step is for, and which steps are optional.
 */
export default function StepCard({
  step,
  title,
  hint,
  done = false,
  optional = false,
  action,
  children,
  className = "",
}: {
  step: number | string;
  title: string;
  hint?: string;
  done?: boolean;
  optional?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-[#E3D6B8] bg-[#F2E8D2] p-4 shadow-sm ${className}`}>
      <header className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold ${
            done ? "bg-[#10B981] text-white" : "bg-[#DC2626] text-white"
          }`}
          aria-hidden="true"
        >
          {done ? <Check size={16} strokeWidth={3} /> : step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 text-[16px] font-extrabold leading-tight text-[#3B2F1E]">
            <T>{title}</T>
            {optional && (
              <span className="rounded-full bg-[#E3D6B8] px-2 py-0.5 text-[11px] font-bold text-[#6B5A40]">
                <T>Optional</T>
              </span>
            )}
          </h2>
          {hint && <p className="mt-0.5 text-[13px] leading-snug text-[#6B5A40]"><T>{hint}</T></p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
