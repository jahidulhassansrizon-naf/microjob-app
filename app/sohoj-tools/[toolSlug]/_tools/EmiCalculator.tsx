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
  DollarSign,
  Home,
  Car,
  User,
  GraduationCap,
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

export default function EmiCalculator() {
  const router = useRouter();

  // Inputs
  const [loanAmount, setLoanAmount] = useState<number | "">("");
  const [interestRate, setInterestRate] = useState<number | "">("");
  const [tenure, setTenure] = useState<number | "">("");
  const [tenureType, setTenureType] = useState<"years" | "months">("years");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Quick example button handler
  const handleQuickExample = (
    amount: number,
    rate: number,
    t: number,
    type: "years" | "months",
  ) => {
    setLoanAmount(amount);
    setInterestRate(rate);
    setTenure(t);
    setTenureType(type);
  };

  // Calculate EMI logic
  const calculateEMI = () => {
    if (
      !loanAmount ||
      !interestRate ||
      !tenure ||
      loanAmount <= 0 ||
      interestRate < 0 ||
      tenure <= 0
    ) {
      return null;
    }

    const principal = Number(loanAmount);
    const ratePerYear = Number(interestRate);
    const months =
      tenureType === "years" ? Number(tenure) * 12 : Number(tenure);

    if (months === 0) return null;

    const monthlyRate = ratePerYear / 12 / 100;

    let monthlyEMI = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (monthlyRate === 0) {
      monthlyEMI = principal / months;
      totalPayment = principal;
      totalInterest = 0;
    } else {
      monthlyEMI =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
      totalPayment = monthlyEMI * months;
      totalInterest = totalPayment - principal;
    }

    return {
      monthlyEMI: Math.round(monthlyEMI),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      totalMonths: months,
    };
  };

  const emiResult = calculateEMI();

  const handleReset = () => {
    setLoanAmount("");
    setInterestRate("");
    setTenure("");
    setTenureType("years");
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
                EMI Calculator
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calculator size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                EMI Calculator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Calculate monthly EMI, total interest, and repayment amount
              instantly.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-rose-500 hover:border-rose-300 transition-all shadow-2xs cursor-pointer"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-rose-400 text-rose-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs cursor-pointer">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: LOAN DETAILS FORM */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Loan details
                </span>
              </div>

              {/* Loan Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Loan Amount <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400 font-medium">
                  Enter the total loan or principal amount
                </p>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="e.g. 1,000,000"
                    value={loanAmount}
                    onChange={(e) =>
                      setLoanAmount(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Annual Interest Rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Annual Interest Rate (%){" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400 font-medium">
                  Yearly interest rate charged by the lender
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) =>
                      setInterestRate(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Loan Tenure */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    Loan Tenure <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-gray-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                    <button
                      onClick={() => setTenureType("years")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${tenureType === "years" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      Years
                    </button>
                    <button
                      onClick={() => setTenureType("months")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${tenureType === "months" ? "bg-amber-500 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      Months
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  How long you will repay the loan
                </p>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={tenure}
                    onChange={(e) =>
                      setTenure(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Quick Examples */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Quick examples
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      handleQuickExample(2500000, 8.5, 20, "years")
                    }
                    className="flex items-center gap-2 p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl text-left transition-colors cursor-pointer text-amber-800 text-[11px] font-bold"
                  >
                    <Home size={13} className="text-amber-600" />
                    <span>Home Loan</span>
                  </button>
                  <button
                    onClick={() => handleQuickExample(800000, 9.0, 5, "years")}
                    className="flex items-center gap-2 p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl text-left transition-colors cursor-pointer text-amber-800 text-[11px] font-bold"
                  >
                    <Car size={13} className="text-amber-600" />
                    <span>Car Loan</span>
                  </button>
                  <button
                    onClick={() => handleQuickExample(300000, 11.0, 3, "years")}
                    className="flex items-center gap-2 p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl text-left transition-colors cursor-pointer text-amber-800 text-[11px] font-bold"
                  >
                    <User size={13} className="text-amber-600" />
                    <span>Personal Loan</span>
                  </button>
                  <button
                    onClick={() => handleQuickExample(500000, 7.5, 4, "years")}
                    className="flex items-center gap-2 p-2 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-xl text-left transition-colors cursor-pointer text-amber-800 text-[11px] font-bold"
                  >
                    <GraduationCap size={13} className="text-amber-600" />
                    <span>Education Loan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MONTHLY EMI PREVIEW */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Monthly EMI</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {emiResult ? "Calculated" : "Empty"}
                  </span>
                </div>

                {/* Result Display */}
                {emiResult ? (
                  <div className="mt-6 space-y-6">
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">
                        Estimated Monthly Payment
                      </p>
                      <h2 className="text-3xl font-extrabold text-rose-900">
                        ৳ {emiResult.monthlyEMI.toLocaleString()}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Principal Amount
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ৳ {Number(loanAmount).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Interest
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ৳ {emiResult.totalInterest.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Payment
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          ৳ {emiResult.totalPayment.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-32 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-2xs">
                      <Calculator size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900">
                      Enter loan amount, interest rate, and tenure to see EMI
                      instantly.
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed">
                      Enter loan amount, interest rate, and tenure to see EMI
                      instantly.
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
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
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
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Enter your total Loan Amount or principal amount in the left
                panel.
              </p>
              <p>
                2. Provide the Annual Interest Rate (%) charged by your
                financial institution.
              </p>
              <p>
                3. Select the Loan Tenure in Years or Months and type the
                duration.
              </p>
              <p>
                4. Instantly view your breakdown of monthly EMI, total interest,
                and total repayment amount on the right.
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-rose-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-rose-600 transition-colors">
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
