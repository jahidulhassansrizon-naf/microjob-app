"use client";
import { Check } from "lucide-react";
import { BulkT } from "./bulkPhotoI18n";

interface BulkStepperProps {
  photosCount: number;
  selectedTotal: number;
  completedCount: number;
  isProcessing: boolean;
}

export default function BulkStepper({ photosCount, selectedTotal, completedCount, isProcessing }: BulkStepperProps) {
  const step1Done = photosCount >= 2;
  const step2Done = selectedTotal > 0;
  const step3Done = completedCount > 0 && !isProcessing;
  const current = !step1Done ? 1 : !step2Done ? 2 : 3;

  const steps = [
    { n: 1, title: "Add photos", hint: "At least 2 photos", done: step1Done },
    { n: 2, title: "Choose AI tools", hint: "Pick what to apply", done: step2Done },
    { n: 3, title: "Start & download", hint: "Get your results", done: step3Done },
  ];

  return (
    <ol className="flex min-w-0 items-center gap-1.5 sm:gap-2" aria-label="Steps">
      {steps.map((step, index) => {
        const active = !step.done && step.n === current;
        return (
          <li key={step.n} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 transition duration-200 ${
                step.done
                  ? "border-emerald-200 bg-emerald-50"
                  : active
                    ? "border-[#DC2626]/50 bg-[#FBF6E8] shadow-sm ring-2 ring-[#DC2626]/15"
                    : "border-[#E3D6B8] bg-[#F6EEDB]"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold ${
                  step.done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-[#DC2626] text-white"
                      : "bg-[#E3D6B8] text-[#6B5A40]"
                }`}
              >
                {step.done ? <Check size={13} strokeWidth={3} /> : step.n}
              </span>
              <span className="min-w-0 leading-tight">
                <span className={`block truncate text-[13.5px] font-bold ${step.done ? "text-emerald-800" : "text-[#3B2F1E]"}`}>
                  <BulkT>{step.title}</BulkT>
                </span>
                <span className="hidden truncate text-[11.5px] font-medium text-[#6B5A40] 2xl:block">
                  <BulkT>{step.hint}</BulkT>
                </span>
              </span>
            </div>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className={`hidden h-0.5 w-4 rounded-full sm:block ${step.done ? "bg-emerald-400" : "bg-[#D8C9A6]"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
