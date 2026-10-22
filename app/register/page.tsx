"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  Phone,
  ArrowLeft,
  KeyRound,
  X,
  AlertCircle,
  Search,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

interface Country {
  name: string;
  code: string;
  flag: string;
  regex: RegExp;
  example: string;
}
type OtpMethod = "email" | "phone";

const country = (
  name: string,
  code: string,
  flag: string,
  regex: RegExp,
  example: string,
): Country => ({ name, code, flag, regex, example });

// Keep the phone-country options and validation used by the existing register flow.
const countriesList: Country[] = [
  country("Bangladesh", "+880", "🇧🇩", /^01[3-9]\d{8}$/, "017XXXXXXXX (11 digits starting with 013-019)"),
  country("Afghanistan", "+93", "🇦🇫", /^7\d{8}$/, "701234567 (9 digits starting with 7)"),
  country("Albania", "+355", "🇦🇱", /^6\d{8}$/, "681234567 (9 digits starting with 6)"),
  country("Algeria", "+213", "🇩🇿", /^[567]\d{8}$/, "551234567 (9 digits starting with 5, 6, or 7)"),
  country("Andorra", "+376", "🇦🇩", /^[346]\d{5}$/, "312345 (6 digits)"),
  country("Angola", "+244", "🇦🇴", /^9\d{8}$/, "923123456 (9 digits starting with 9)"),
  country("Argentina", "+54", "🇦🇷", /^9\d{10}$/, "91112345678 (11 digits)"),
  country("Armenia", "+374", "🇦🇲", /^[1-9]\d{7}$/, "91123456 (8 digits)"),
  country("Australia", "+61", "🇦🇺", /^4\d{8}$/, "412345678 (9 digits starting with 4)"),
  country("Austria", "+43", "🇦🇹", /^6\d{9,10}$/, "6501234567"),
  country("Azerbaijan", "+994", "🇦🇿", /^[1-9]\d{8}$/, "401234567 (9 digits)"),
  country("Bahrain", "+973", "🇧🇭", /^[36]\d{7}$/, "39123456 (8 digits)"),
  country("Barbados", "+1", "🇧🇧", /^\d{10}$/, "2461234567 (10 digits)"),
  country("Belarus", "+375", "🇧🇾", /^(25|29|33|44)\d{7}$/, "291234567"),
  country("Belgium", "+32", "🇧🇪", /^4\d{8}$/, "470123456 (9 digits starting with 4)"),
  country("Belize", "+501", "🇧🇿", /^[68]\d{6}$/, "6012345 (7 digits)"),
  country("Benin", "+229", "🇧🇯", /^[2469]\d{7}$/, "90123456 (8 digits)"),
  country("Bhutan", "+975", "🇧🇹", /^1[67]\d{6}$/, "17123456 (8 digits)"),
  country("Bolivia", "+591", "🇧🇴", /^[67]\d{7}$/, "70123456 (8 digits starting with 6 or 7)"),
  country("Brazil", "+55", "🇧🇷", /^[1-9]{2}9\d{8}$/, "11987654321 (11 digits with area code)"),
  country("Brunei", "+673", "🇧🇳", /^[2378]\d{6}$/, "8123456 (7 digits)"),
  country("Bulgaria", "+359", "🇧🇬", /^[879]\d{8}$/, "881234567 (9 digits)"),
  country("Cambodia", "+855", "🇰🇭", /^[1-9]\d{7,8}$/, "12345678"),
  country("Cameroon", "+237", "🇨🇲", /^[26]\d{8}$/, "671234567 (9 digits)"),
  country("Canada", "+1", "🇨🇦", /^\d{10}$/, "4161234567 (10 digits)"),
  country("China", "+86", "🇨🇳", /^1[3-9]\d{9}$/, "13812345678 (11 digits starting with 13-19)"),
  country("Colombia", "+57", "🇨🇴", /^3\d{9}$/, "3001234567 (10 digits starting with 3)"),
  country("Denmark", "+45", "🇩🇰", /^\d{8}$/, "20123456 (8 digits)"),
  country("Egypt", "+20", "🇪🇬", /^1[0125]\d{8}$/, "1012345678 (10 digits)"),
  country("Finland", "+358", "🇫🇮", /^[1-9]\d{8,9}$/, "401234567"),
  country("France", "+33", "🇫🇷", /^[67]\d{8}$/, "612345678 (9 digits starting with 6 or 7)"),
  country("Germany", "+49", "🇩🇪", /^1[567]\d{8,9}$/, "15123456789"),
  country("Greece", "+30", "🇬🇷", /^6\d{9}$/, "6912345678 (10 digits)"),
  country("Hong Kong", "+852", "🇭🇰", /^[456789]\d{7}$/, "91234567 (8 digits)"),
  // Corrected: the old character-class expression incorrectly matched individual digits.
  country("Hungary", "+36", "🇭🇺", /^(20|30|31|50|70)\d{7}$/, "301234567"),
  country("India", "+91", "🇮🇳", /^[6-9]\d{9}$/, "9876543210 (10 digits starting with 6-9)"),
  country("Indonesia", "+62", "🇮🇩", /^8\d{8,11}$/, "81234567890"),
  country("Iran", "+98", "🇮🇷", /^9\d{9}$/, "9123456789 (10 digits starting with 9)"),
  country("Iraq", "+964", "🇮🇶", /^7\d{9}$/, "7912345678 (10 digits starting with 7)"),
  country("Ireland", "+353", "🇮🇪", /^8\d{8}$/, "871234567 (9 digits starting with 8)"),
  country("Italy", "+39", "🇮🇹", /^3\d{8,9}$/, "3123456789"),
  country("Japan", "+81", "🇯🇵", /^[789]0\d{8}$/, "9012345678 (10 digits)"),
  country("Jordan", "+962", "🇯🇴", /^7\d{8}$/, "791234567 (9 digits)"),
  country("Kuwait", "+965", "🇰🇼", /^[569]\d{7}$/, "50123456 (8 digits)"),
  country("Malaysia", "+60", "🇲🇾", /^1\d{8,9}$/, "123456789"),
  country("Maldives", "+960", "🇲🇻", /^[78]\d{6}$/, "7712345 (7 digits)"),
  country("Mexico", "+52", "🇲🇽", /^\d{10}$/, "5512345678 (10 digits)"),
  country("Myanmar", "+95", "🇲🇲", /^9\d{7,8}$/, "912345678"),
  country("Nepal", "+977", "🇳🇵", /^9[678]\d{8}$/, "9812345678 (10 digits)"),
  country("Netherlands", "+31", "🇳🇱", /^6\d{8}$/, "612345678 (9 digits)"),
  country("New Zealand", "+64", "🇳🇿", /^2\d{7,8}$/, "211234567"),
  country("Nigeria", "+234", "🇳🇬", /^[789]\d{9}$/, "8021234567 (10 digits)"),
  country("Norway", "+47", "🇳🇴", /^[49]\d{7}$/, "41234567 (8 digits)"),
  country("Oman", "+968", "🇴🇲", /^[79]\d{7}$/, "91234567 (8 digits)"),
  country("Pakistan", "+92", "🇵🇰", /^3\d{9}$/, "3001234567 (10 digits)"),
  country("Philippines", "+63", "🇵🇭", /^9\d{9}$/, "9123456789 (10 digits)"),
  country("Poland", "+48", "🇵🇱", /^[45678]\d{8}$/, "501234567 (9 digits)"),
  country("Portugal", "+351", "🇵🇹", /^9[1236]\d{7}$/, "912345678 (9 digits)"),
  country("Qatar", "+974", "🇶🇦", /^[3567]\d{7}$/, "55123456 (8 digits)"),
  country("Romania", "+40", "🇷🇴", /^7\d{8}$/, "712345678 (9 digits)"),
  country("Russia", "+7", "🇷🇺", /^9\d{9}$/, "9123456789 (10 digits)"),
  country("Saudi Arabia", "+966", "🇸🇦", /^5\d{8}$/, "501234567 (9 digits)"),
  country("Singapore", "+65", "🇸🇬", /^[89]\d{7}$/, "81234567 (8 digits)"),
  country("South Africa", "+27", "🇿🇦", /^[678]\d{8}$/, "821234567 (9 digits)"),
  country("South Korea", "+82", "🇰🇷", /^1[016789]\d{7,8}$/, "1012345678"),
  country("Spain", "+34", "🇪🇸", /^[67]\d{8}$/, "612345678 (9 digits)"),
  country("Sri Lanka", "+94", "🇱🇰", /^7\d{8}$/, "712345678 (9 digits)"),
  country("Sweden", "+46", "🇸🇪", /^7\d{8}$/, "701234567 (9 digits)"),
  country("Switzerland", "+41", "🇨🇭", /^7[5689]\d{7}$/, "791234567 (9 digits)"),
  country("Taiwan", "+886", "🇹🇼", /^9\d{8}$/, "912345678 (9 digits)"),
  country("Thailand", "+66", "🇹🇭", /^[689]\d{8}$/, "812345678 (9 digits)"),
  country("Turkey", "+90", "🇹🇷", /^5\d{9}$/, "5012345678 (10 digits)"),
  country("Ukraine", "+380", "🇺🇦", /^[3569]\d{8}$/, "501234567 (9 digits)"),
  country("United Arab Emirates", "+971", "🇦🇪", /^5\d{8}$/, "501234567 (9 digits)"),
  country("United Kingdom", "+44", "🇬🇧", /^7\d{9}$/, "7911123456 (10 digits)"),
  country("United States", "+1", "🇺🇸", /^\d{10}$/, "2025550143 (10 digits)"),
  country("Vietnam", "+84", "🇻🇳", /^(3|5|7|8|9)\d{8}$/, "912345678 (9 digits)"),
  country("Yemen", "+967", "🇾🇪", /^7\d{8}$/, "712345678 (9 digits)"),
];

const countryNamesBn: Record<string, string> = {
  Bangladesh: "বাংলাদেশ", Afghanistan: "আফগানিস্তান", Albania: "আলবেনিয়া", Algeria: "আলজেরিয়া", Andorra: "অ্যান্ডোরা", Angola: "অ্যাঙ্গোলা", Argentina: "আর্জেন্টিনা", Armenia: "আর্মেনিয়া", Australia: "অস্ট্রেলিয়া", Austria: "অস্ট্রিয়া", Azerbaijan: "আজারবাইজান", Bahrain: "বাহরাইন", Barbados: "বার্বাডোস", Belarus: "বেলারুশ", Belgium: "বেলজিয়াম", Belize: "বেলিজ", Benin: "বেনিন", Bhutan: "ভুটান", Bolivia: "বলিভিয়া", Brazil: "ব্রাজিল", Brunei: "ব্রুনেই", Bulgaria: "বুলগেরিয়া", Cambodia: "কম্বোডিয়া", Cameroon: "ক্যামেরুন", Canada: "কানাডা", China: "চীন", Colombia: "কলম্বিয়া", Denmark: "ডেনমার্ক", Egypt: "মিশর", Finland: "ফিনল্যান্ড", France: "ফ্রান্স", Germany: "জার্মানি", Greece: "গ্রিস", "Hong Kong": "হংকং", Hungary: "হাঙ্গেরি", India: "ভারত", Indonesia: "ইন্দোনেশিয়া", Iran: "ইরান", Iraq: "ইরাক", Ireland: "আয়ারল্যান্ড", Italy: "ইতালি", Japan: "জাপান", Jordan: "জর্ডান", Kuwait: "কুয়েত", Malaysia: "মালয়েশিয়া", Maldives: "মালদ্বীপ", Mexico: "মেক্সিকো", Myanmar: "মিয়ানমার", Nepal: "নেপাল", Netherlands: "নেদারল্যান্ডস", "New Zealand": "নিউজিল্যান্ড", Nigeria: "নাইজেরিয়া", Norway: "নরওয়ে", Oman: "ওমান", Pakistan: "পাকিস্তান", Philippines: "ফিলিপাইন", Poland: "পোল্যান্ড", Portugal: "পর্তুগাল", Qatar: "কাতার", Romania: "রোমানিয়া", Russia: "রাশিয়া", "Saudi Arabia": "সৌদি আরব", Singapore: "সিঙ্গাপুর", "South Africa": "দক্ষিণ আফ্রিকা", "South Korea": "দক্ষিণ কোরিয়া", Spain: "স্পেন", "Sri Lanka": "শ্রীলঙ্কা", Sweden: "সুইডেন", Switzerland: "সুইজারল্যান্ড", Taiwan: "তাইওয়ান", Thailand: "থাইল্যান্ড", Turkey: "তুরস্ক", Ukraine: "ইউক্রেন", "United Arab Emirates": "সংযুক্ত আরব আমিরাত", "United Kingdom": "যুক্তরাজ্য", "United States": "যুক্তরাষ্ট্র", Vietnam: "ভিয়েতনাম", Yemen: "ইয়েমেন",
};

function friendlyError(message: string, isBn: boolean): string {
  if (!isBn) return message;
  const lower = message.toLowerCase();
  if (lower.includes("password") && lower.includes("match")) return "পাসওয়ার্ড দুটি মিলছে না।";
  if (lower.includes("invalid phone number format")) return "নির্বাচিত দেশের নিয়ম অনুযায়ী ফোন নম্বরটি সঠিক নয়। নম্বরটি যাচাই করুন।";
  if (lower.includes("failed to send otp")) return "OTP পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (lower.includes("valid 6-digit otp") || lower.includes("enter a valid otp")) return "সঠিক ৬ সংখ্যার OTP কোড লিখুন।";
  if (lower.includes("registration failed")) return "নিবন্ধন সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।";
  if (lower.includes("network") || lower.includes("fetch")) return "সংযোগে সমস্যা হয়েছে। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।";
  return message;
}

export default function RegisterPage() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();
  const isBn = locale === "bn";
  const tx = (en: string, bn: string) => (isBn ? bn : en);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [otpMethod, setOtpMethod] = useState<OtpMethod>("email");
  const [methodNotice, setMethodNotice] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [formData, setFormData] = useState({
    countryName: "Bangladesh",
    countryCode: "+880",
    countryFlag: "🇧🇩",
    phone: "",
    email: "",
    fullName: "",
    district: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const changeLanguage = (targetLang: "EN" | "BN") => setLocale(targetLang === "BN" ? "bn" : "en");

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayCountry = (name: string) => (isBn ? countryNamesBn[name] || name : name);
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countriesList;
    return countriesList.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      (countryNamesBn[c.name] || "").toLowerCase().includes(query) ||
      c.code.includes(query),
    );
  }, [countrySearch, isBn]);

  const validatePhonePattern = (): boolean => {
    const selectedCountry = countriesList.find((c) => c.name === formData.countryName);
    if (!selectedCountry) return true;
    if (!selectedCountry.regex.test(formData.phone.trim())) {
      setErrorMessage(
        isBn
          ? `${displayCountry(selectedCountry.name)}-এর জন্য ফোন নম্বরের ফরম্যাট সঠিক নয়। উদাহরণ: ${selectedCountry.example}`
          : `Invalid phone number format for ${selectedCountry.name}. Expected format: ${selectedCountry.example}`,
      );
      return false;
    }
    return true;
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setMethodNotice("");
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(tx("Passwords do not match.", "পাসওয়ার্ড দুটি মিলছে না।"));
      return;
    }
    if (!validatePhonePattern()) return;
    setIsMethodModalOpen(true);
  };

  const handleSendOtp = async () => {
    setMethodNotice("");
    setErrorMessage("");
    if (otpMethod === "phone") {
      setMethodNotice(tx(
        "SMS verification is temporarily unavailable. Please choose email to receive your OTP.",
        "সাময়িকভাবে SMS যাচাইকরণ বন্ধ রয়েছে। OTP পেতে ইমেইল নির্বাচন করুন।",
      ));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phoneNumber: formData.phone,
          country: `${formData.countryName} (${formData.countryCode})`,
          identifier: formData.email,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || tx("Failed to send OTP.", "OTP পাঠানো যায়নি।"));
      setIsMethodModalOpen(false);
      setIsOtpModalOpen(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : tx("Failed to send OTP.", "OTP পাঠানো যায়নি।");
      setMethodNotice(friendlyError(message, isBn));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setOtpError("");
    if (!/^\d{6}$/.test(otp)) {
      setOtpError(tx("Please enter a valid 6-digit OTP.", "সঠিক ৬ সংখ্যার OTP কোড লিখুন।"));
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: `${formData.countryName} (${formData.countryCode})`,
          phoneNumber: formData.phone,
          email: formData.email,
          fullName: formData.fullName,
          district: formData.district,
          password: formData.password,
          otp,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || tx("Registration failed.", "নিবন্ধন সম্পন্ন হয়নি।"));
      window.alert(tx("Registration successful! Please sign in.", "নিবন্ধন সফল হয়েছে! এবার লগইন করুন।"));
      setIsOtpModalOpen(false);
      const params = new URLSearchParams(window.location.search);
      const requestedTarget = params.get("callbackUrl") || params.get("redirect") || "";
      const safeTarget = requestedTarget.startsWith("/") && !requestedTarget.startsWith("//") && !/^\/(?:login|register)(?:[/?#]|$)/i.test(requestedTarget)
        ? requestedTarget
        : "";
      router.push(safeTarget ? `/login?callbackUrl=${encodeURIComponent(safeTarget)}` : "/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : tx("Registration failed.", "নিবন্ধন সম্পন্ন হয়নি।");
      setOtpError(friendlyError(message, isBn));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-[#F7F8FC] to-indigo-50/70 font-sans text-slate-900">
      {/* Registration form */}
      <main className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-between p-5 sm:p-8 lg:px-10 lg:py-8 xl:px-12">
        <div className="flex w-full items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-indigo-600">
            <ArrowLeft size={16} />
            <span>{tx("Back to Home", "হোমে ফিরে যান")}</span>
          </Link>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold shadow-sm" aria-label={tx("Choose language", "ভাষা নির্বাচন করুন")}>
            <button type="button" onClick={() => changeLanguage("EN")} aria-pressed={locale === "en"} className={`rounded-lg px-3 py-1.5 transition ${locale === "en" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>EN</button>
            <button type="button" onClick={() => changeLanguage("BN")} aria-pressed={locale === "bn"} className={`rounded-lg px-3 py-1.5 transition ${locale === "bn" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>বাংলা</button>
          </div>
        </div>

        <section className="mx-auto my-auto w-full max-w-xl py-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="group mb-3 inline-flex items-center gap-3" aria-label="Sohoj Hub home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-base font-black text-white shadow-lg shadow-indigo-500/20 transition group-hover:scale-105">SH</span>
              <span className="text-left">
                <span className="block text-2xl font-black tracking-tight text-slate-900">Sohoj <span className="text-indigo-600">Hub</span></span>
                <span className="mt-0.5 block text-[9px] font-bold tracking-[0.22em] text-slate-400">SOHOJHUB.COM</span>
              </span>
            </Link>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{tx("Create your account", "আপনার অ্যাকাউন্ট তৈরি করুন")}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{tx("Join Sohoj Hub to access your digital workspace.", "আপনার ডিজিটাল কর্মক্ষেত্র ব্যবহার করতে সহজ হাবে যোগ দিন।")}</p>
          </div>

          <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-600 via-violet-500 to-emerald-400" />
            {errorMessage && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">{errorMessage}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative space-y-1" ref={dropdownRef}>
                  <label className={labelClass}>{tx("Country", "দেশ")} <span className="text-red-500">*</span></label>
                  <button type="button" aria-haspopup="listbox" aria-expanded={isCountryOpen} onClick={() => setIsCountryOpen((open) => !open)} className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
                    <span className="flex min-w-0 items-center gap-2 truncate"><span className="text-base">{formData.countryFlag}</span><span className="truncate">{displayCountry(formData.countryName)} ({formData.countryCode})</span></span>
                    <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${isCountryOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isCountryOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 flex max-h-72 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-2xl" role="listbox">
                      <div className="relative mb-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="search" value={countrySearch} onChange={(event) => setCountrySearch(event.target.value)} placeholder={tx("Search country or code…", "দেশ বা কোড খুঁজুন…")} autoFocus className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500" />
                      </div>
                      <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                        {filteredCountries.length ? filteredCountries.map((item) => (
                          <button key={item.name} type="button" role="option" aria-selected={formData.countryName === item.name} onClick={() => {
                            setFormData((previous) => ({ ...previous, countryName: item.name, countryCode: item.code, countryFlag: item.flag }));
                            setIsCountryOpen(false);
                            setCountrySearch("");
                          }} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${formData.countryName === item.name ? "bg-indigo-50 font-bold text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}>
                            <span className="flex min-w-0 items-center gap-2"><span className="text-base">{item.flag}</span><span className="truncate">{displayCountry(item.name)}</span></span>
                            <span className="shrink-0 text-slate-400">{item.code}</span>
                          </button>
                        )) : <p className="px-3 py-5 text-center text-xs text-slate-400">{tx("No country found.", "কোনো দেশ পাওয়া যায়নি।")}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>{tx("Phone number", "ফোন নম্বর")} <span className="text-red-500">*</span></label>
                  <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="tel" required autoComplete="tel-national" value={formData.phone} onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))} placeholder={tx("Enter number without country code", "কান্ট্রি কোড ছাড়া নম্বর লিখুন")} className={`${inputClass} pl-9`} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClass}>{tx("Email address", "ইমেইল ঠিকানা")} <span className="text-red-500">*</span></label>
                  <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="email" value={formData.email} onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))} placeholder={tx("you@example.com", "আপনার ইমেইল ঠিকানা")} className={`${inputClass} pl-9`} /></div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>{tx("Full name", "পূর্ণ নাম")} <span className="text-red-500">*</span></label>
                  <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" required autoComplete="name" value={formData.fullName} onChange={(event) => setFormData((previous) => ({ ...previous, fullName: event.target.value }))} placeholder={tx("Enter your full name", "আপনার পূর্ণ নাম লিখুন")} className={`${inputClass} pl-9`} /></div>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>{tx("District", "জেলা")} <span className="text-red-500">*</span></label>
                <div className="relative"><MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select required value={formData.district} onChange={(event) => setFormData((previous) => ({ ...previous, district: event.target.value }))} className={`${inputClass} appearance-none pl-9 pr-9`}>
                  <option value="" disabled>{tx("Choose your district", "আপনার জেলা নির্বাচন করুন")}</option>
                  {[
                    ["Dhaka", "ঢাকা"], ["Bogura", "বগুড়া"], ["Chattogram", "চট্টগ্রাম"], ["Sylhet", "সিলেট"], ["Rajshahi", "রাজশাহী"], ["Khulna", "খুলনা"], ["Barishal", "বরিশাল"], ["Rangpur", "রংপুর"], ["Mymensingh", "ময়মনসিংহ"],
                  ].map(([en, bn]) => <option key={en} value={en}>{tx(en, bn)}</option>)}
                </select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClass}>{tx("Password", "পাসওয়ার্ড")} <span className="text-red-500">*</span></label>
                  <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={6} value={formData.password} onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))} placeholder={tx("Create a password", "একটি পাসওয়ার্ড তৈরি করুন")} className={`${inputClass} pl-9 pr-10`} /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? tx("Hide password", "পাসওয়ার্ড লুকান") : tx("Show password", "পাসওয়ার্ড দেখান")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>{tx("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")} <span className="text-red-500">*</span></label>
                  <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showConfirmPassword ? "text" : "password"} required autoComplete="new-password" minLength={6} value={formData.confirmPassword} onChange={(event) => setFormData((previous) => ({ ...previous, confirmPassword: event.target.value }))} placeholder={tx("Re-enter your password", "আবার পাসওয়ার্ড লিখুন")} className={`${inputClass} pl-9 pr-10`} /><button type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? tx("Hide password", "পাসওয়ার্ড লুকান") : tx("Show password", "পাসওয়ার্ড দেখান")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-indigo-600">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 text-xs leading-5 text-slate-600">
                <input type="checkbox" required checked={formData.agreeTerms} onChange={(event) => setFormData((previous) => ({ ...previous, agreeTerms: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600" />
                <span>{tx("I agree to the ", "আমি সম্মত হচ্ছি ")}<Link href="/terms" className="font-semibold text-indigo-600 hover:underline">{tx("Terms of Service", "ব্যবহারের শর্তাবলি")}</Link>{tx(" and ", " এবং ")}<Link href="/privacy-policy" className="font-semibold text-indigo-600 hover:underline">{tx("Privacy Policy", "গোপনীয়তা নীতি")}</Link>.</span>
              </label>

              <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />{tx("Please wait…", "অপেক্ষা করুন…")}</> : tx("Create account", "অ্যাকাউন্ট তৈরি করুন")}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">{tx("Already have an account?", "আগেই অ্যাকাউন্ট আছে?")} <Link href="/login" className="ml-1 font-bold text-indigo-600 hover:underline">{tx("Sign in", "লগইন করুন")}</Link></p>
        </section>
        <div className="h-2" />
      </main>

      {/* OTP method modal */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="otp-method-title">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setIsMethodModalOpen(false)} aria-label={tx("Close dialog", "ডায়ালগ বন্ধ করুন")} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><KeyRound size={24} /></div>
            <h3 id="otp-method-title" className="text-center text-lg font-extrabold">{tx("Choose a verification method", "যাচাইয়ের পদ্ধতি বেছে নিন")}</h3>
            <p className="mb-5 mt-2 text-center text-xs leading-5 text-slate-500">{tx("Where would you like to receive your one-time code?", "আপনি কোথায় একবারের যাচাইকরণ কোডটি পেতে চান?")}</p>
            {methodNotice && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertCircle size={17} className="mt-0.5 shrink-0" /><p>{methodNotice}</p></div>}
            <div className="mb-5 space-y-3">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${otpMethod === "email" ? "border-indigo-500 bg-indigo-50/70" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="otpMethod" value="email" checked={otpMethod === "email"} onChange={() => { setOtpMethod("email"); setMethodNotice(""); }} className="h-4 w-4 accent-indigo-600" />
                <Mail size={19} className="shrink-0 text-indigo-600" />
                <span className="min-w-0"><span className="block text-sm font-bold">{tx("Email verification", "ইমেইলের মাধ্যমে যাচাই")}</span><span className="block truncate text-xs text-slate-500">{formData.email || tx("Your email address", "আপনার ইমেইল ঠিকানা")}</span></span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${otpMethod === "phone" ? "border-indigo-500 bg-indigo-50/70" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="otpMethod" value="phone" checked={otpMethod === "phone"} onChange={() => { setOtpMethod("phone"); setMethodNotice(""); }} className="h-4 w-4 accent-indigo-600" />
                <Phone size={19} className="shrink-0 text-indigo-600" />
                <span className="min-w-0"><span className="block text-sm font-bold">{tx("Phone verification", "ফোন নম্বরের মাধ্যমে যাচাই")}</span><span className="block truncate text-xs text-slate-500">{formData.countryCode} {formData.phone || tx("Your phone number", "আপনার ফোন নম্বর")}</span></span>
              </label>
            </div>
            <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60">{loading ? tx("Sending code…", "কোড পাঠানো হচ্ছে…") : tx("Send verification code", "যাচাইকরণ কোড পাঠান")}</button>
          </div>
        </div>
      )}

      {/* OTP verification modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="otp-title">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-2xl shadow-indigo-950/20 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500" />
            <button type="button" onClick={() => setIsOtpModalOpen(false)} aria-label={tx("Close dialog", "ডায়ালগ বন্ধ করুন")} className="absolute right-3 top-3 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            <div className="mb-5 flex justify-center">
              <Link href="/" aria-label="Sohoj Hub home" className="inline-flex items-center gap-2.5 rounded-2xl px-3 py-2 transition hover:bg-slate-50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-500/20">SH</span>
                <span className="text-left"><span className="block text-lg font-black tracking-tight text-slate-900">Sohoj <span className="text-indigo-600">Hub</span></span><span className="mt-0.5 block text-[8px] font-bold tracking-[0.2em] text-slate-400">SOHOJHUB.COM</span></span>
              </Link>
            </div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 text-indigo-600 ring-1 ring-indigo-100"><ShieldCheck size={25} /></div>
            <div className="mb-5 text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700"><ShieldCheck size={12} />{tx("Secure verification", "নিরাপদ যাচাইকরণ")}</div>
              <h3 id="otp-title" className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{tx("Verify your email", "আপনার ইমেইল যাচাই করুন")}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{tx("We sent a 6-digit verification code to", "আমরা ৬ সংখ্যার যাচাইকরণ কোড পাঠিয়েছি")} <span className="break-all font-semibold text-slate-800">{formData.email}</span></p>
            </div>
            {otpError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium leading-5 text-red-700">{otpError}</div>}
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/70 p-4 sm:p-5">
              <label htmlFor="register-otp" className="mb-2.5 block text-xs font-bold text-slate-700">{tx("Enter 6-digit code", "৬ সংখ্যার কোড লিখুন")}</label>
              <input id="register-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="1 2 3 4 5 6" className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3.5 text-center text-xl font-extrabold tracking-[0.35em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15" />
              <p className="mt-2.5 text-center text-[11px] leading-5 text-slate-500">{tx("The code is valid for 5 minutes. Keep it private.", "কোডটি ৫ মিনিট পর্যন্ত কার্যকর। এটি গোপন রাখুন।")}</p>
            </div>
            <button type="button" onClick={handleVerifyAndRegister} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{loading ? tx("Verifying…", "যাচাই করা হচ্ছে…") : tx("Verify and create account", "যাচাই করে অ্যাকাউন্ট তৈরি করুন")}</button>
            <button type="button" onClick={handleSendOtp} disabled={loading} className="mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50">{tx("Didn't receive the code? Resend", "কোড পাননি? আবার পাঠান")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
