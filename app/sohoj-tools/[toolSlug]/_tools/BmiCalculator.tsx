"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Calculator,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
  {
    title: "Family Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/family-card-form",
    icon: CreditCard,
  },
  {
    title: "Fuel Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/fuel-card-form",
    icon: CreditCard,
  },
  {
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
];

export default function BmiCalculator() {
  const router = useRouter();

  // Inputs
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");

  const [weight, setWeight] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [heightFt, setHeightFt] = useState<number | "">("");
  const [heightIn, setHeightIn] = useState<number | "">("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Calculate BMI logic
  const calculateBMI = () => {
    if (!weight || weight <= 0) return null;

    let weightInKg = Number(weight);
    if (weightUnit === "lb") {
      weightInKg = weightInKg * 0.45359237;
    }

    let heightInMeters = 0;

    if (heightUnit === "cm") {
      if (!heightCm || heightCm <= 0) return null;
      heightInMeters = Number(heightCm) / 100;
    } else {
      if (!heightFt && heightFt !== 0) return null;
      const ft = Number(heightFt);
      const inches = Number(heightIn || 0);
      const totalInches = ft * 12 + inches;
      if (totalInches <= 0) return null;
      heightInMeters = totalInches * 0.0254;
    }

    if (heightInMeters === 0) return null;

    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    let category = "";
    let colorClass = "";
    let bgClass = "";

    if (bmiValue < 18.5) {
      category = "Underweight";
      colorClass = "text-blue-700";
      bgClass = "bg-blue-50 border-blue-200";
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      category = "Normal weight";
      colorClass = "text-emerald-700";
      bgClass = "bg-emerald-50 border-emerald-200";
    } else if (bmiValue >= 25 && bmiValue < 30) {
      category = "Overweight";
      colorClass = "text-amber-700";
      bgClass = "bg-amber-50 border-amber-200";
    } else {
      category = "Obese";
      colorClass = "text-rose-700";
      bgClass = "bg-rose-50 border-rose-200";
    }

    return {
      bmi: bmiValue.toFixed(1),
      category,
      colorClass,
      bgClass,
    };
  };

  const bmiResult = calculateBMI();

  const handleReset = () => {
    setWeight("");
    setHeightCm("");
    setHeightFt("");
    setHeightIn("");
    setWeightUnit("kg");
    setHeightUnit("cm");
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1 cursor-pointer"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                General Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                BMI Calculator
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calculator size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                BMI Calculator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Calculate your Body Mass Index (BMI) instantly — metric or
              imperial units.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-all shadow-2xs cursor-pointer"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-orange-400 text-orange-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs cursor-pointer">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: MEASUREMENTS FORM */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Your measurements
                </span>
              </div>

              {/* Weight Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Weight <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                    <button
                      onClick={() => setWeightUnit("kg")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${weightUnit === "kg" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => setWeightUnit("lb")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${weightUnit === "lb" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      lb
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  {weightUnit === "kg" ? "Kilograms (kg)" : "Pounds (lb)"}
                </p>
              </div>

              {/* Height Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Height <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                    <button
                      onClick={() => setHeightUnit("cm")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${heightUnit === "cm" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      cm
                    </button>
                    <button
                      onClick={() => setHeightUnit("ft")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${heightUnit === "ft" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      ft/in
                    </button>
                  </div>
                </div>

                {heightUnit === "cm" ? (
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 170"
                      value={heightCm}
                      onChange={(e) =>
                        setHeightCm(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Feet (e.g. 5)"
                      value={heightFt}
                      onChange={(e) =>
                        setHeightFt(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Inches (e.g. 8)"
                      value={heightIn}
                      onChange={(e) =>
                        setHeightIn(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
                <p className="text-[11px] text-gray-400 font-medium">
                  {heightUnit === "cm" ? "Centimeters (cm)" : "Feet & Inches"}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: YOUR BMI PREVIEW */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Your BMI</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {bmiResult ? "Calculated" : "Empty"}
                  </span>
                </div>

                {/* Result Display */}
                {bmiResult ? (
                  <div className="mt-6 space-y-6">
                    <div
                      className={`border rounded-2xl p-6 text-center space-y-2 ${bmiResult.bgClass}`}
                    >
                      <p
                        className={`text-xs font-bold uppercase tracking-widest ${bmiResult.colorClass}`}
                      >
                        Body Mass Index
                      </p>
                      <h2
                        className={`text-4xl font-extrabold ${bmiResult.colorClass}`}
                      >
                        {bmiResult.bmi}
                      </h2>
                      <p
                        className={`text-sm font-bold pt-1 ${bmiResult.colorClass}`}
                      >
                        Category: {bmiResult.category}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-blue-700 font-bold uppercase">
                          Underweight
                        </p>
                        <p className="text-xs font-semibold text-gray-600">
                          &lt; 18.5
                        </p>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-emerald-700 font-bold uppercase">
                          Normal
                        </p>
                        <p className="text-xs font-semibold text-gray-600">
                          18.5 - 24.9
                        </p>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-amber-700 font-bold uppercase">
                          Overweight
                        </p>
                        <p className="text-xs font-semibold text-gray-600">
                          25 - 29.9
                        </p>
                      </div>
                      <div className="bg-rose-50/50 border border-rose-200/60 rounded-xl p-3 space-y-1">
                        <p className="text-[10px] text-rose-700 font-bold uppercase">
                          Obese
                        </p>
                        <p className="text-xs font-semibold text-gray-600">
                          &ge; 30
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-32 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-2xs">
                      <Calculator size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900">
                      Enter your weight and height to calculate BMI.
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed">
                      Enter weight and height to see your BMI and category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>
              Your files are processed in the browser — they are not uploaded to
              any server.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Calculator size={14} />
              <span>Print / Save</span>
            </button>
          </div>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Choose your preferred weight unit (kg or lb) and enter your
                weight value.
              </p>
              <p>
                2. Choose your height unit (cm or ft/in) and enter your height
                details.
              </p>
              <p>
                3. Instantly view your calculated BMI score and health category
                on the right panel.
              </p>
            </div>
          )}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
