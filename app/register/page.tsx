"use client";

import { useState, useRef, useEffect } from "react";
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
  MessageCircle,
  ArrowLeft,
  KeyRound,
  X,
  AlertCircle,
  Search,
  ChevronDown,
} from "lucide-react";

// পৃথিবীর সমস্ত দেশের তালিকা (সঠিক লেন্থ এবং কড়া Regex সহ)
const countriesList = [
  {
    name: "Bangladesh",
    code: "+880",
    flag: "🇧🇩",
    regex: /^01[3-9]\d{8}$/,
    example: "017XXXXXXXX (11 digits starting with 013-019)",
  },
  {
    name: "Afghanistan",
    code: "+93",
    flag: "🇦🇫",
    regex: /^7\d{8}$/,
    example: "701234567 (9 digits starting with 7)",
  },
  {
    name: "Albania",
    code: "+355",
    flag: "🇦🇱",
    regex: /^6\d{8}$/,
    example: "681234567 (9 digits starting with 6)",
  },
  {
    name: "Algeria",
    code: "+213",
    flag: "🇩🇿",
    regex: /^[567]\d{8}$/,
    example: "551234567 (9 digits starting with 5, 6, or 7)",
  },
  {
    name: "Andorra",
    code: "+376",
    flag: "🇦🇩",
    regex: /^[346]\d{5}$/,
    example: "312345 (6 digits)",
  },
  {
    name: "Angola",
    code: "+244",
    flag: "🇦🇴",
    regex: /^9\d{8}$/,
    example: "923123456 (9 digits starting with 9)",
  },
  {
    name: "Argentina",
    code: "+54",
    flag: "🇦🇷",
    regex: /^9\d{10}$/,
    example: "91112345678 (11 digits)",
  },
  {
    name: "Armenia",
    code: "+374",
    flag: "🇦🇲",
    regex: /^[1-9]\d{7}$/,
    example: "91123456 (8 digits)",
  },
  {
    name: "Australia",
    code: "+61",
    flag: "🇦🇺",
    regex: /^4\d{8}$/,
    example: "412345678 (9 digits starting with 4)",
  },
  {
    name: "Austria",
    code: "+43",
    flag: "🇦🇹",
    regex: /^6\d{9,10}$/,
    example: "6501234567",
  },
  {
    name: "Azerbaijan",
    code: "+994",
    flag: "🇦🇿",
    regex: /^[1-9]\d{8}$/,
    example: "401234567 (9 digits)",
  },
  {
    name: "Bahrain",
    code: "+973",
    flag: "🇧🇭",
    regex: /^[36]\d{7}$/,
    example: "39123456 (8 digits starting with 3 or 6)",
  },
  {
    name: "Barbados",
    code: "+1",
    flag: "🇧🇧",
    regex: /^\d{10}$/,
    example: "2461234567 (10 digits)",
  },
  {
    name: "Belarus",
    code: "+375",
    flag: "🇧🇾",
    regex: /^(25|29|33|44)\d{7}$/,
    example: "291234567",
  },
  {
    name: "Belgium",
    code: "+32",
    flag: "🇧🇪",
    regex: /^4\d{8}$/,
    example: "470123456 (9 digits starting with 4)",
  },
  {
    name: "Belize",
    code: "+501",
    flag: "🇧🇿",
    regex: /^[68]\d{6}$/,
    example: "6012345 (7 digits)",
  },
  {
    name: "Benin",
    code: "+229",
    flag: "🇧🇯",
    regex: /^[2469]\d{7}$/,
    example: "90123456 (8 digits)",
  },
  {
    name: "Bhutan",
    code: "+975",
    flag: "🇧🇹",
    regex: /^1[67]\d{6}$/,
    example: "17123456 (8 digits)",
  },
  {
    name: "Bolivia",
    code: "+591",
    flag: "🇧🇴",
    regex: /^[67]\d{7}$/,
    example: "70123456 (8 digits starting with 6 or 7)",
  },
  {
    name: "Brazil",
    code: "+55",
    flag: "🇧🇷",
    regex: /^[1-9]{2}9\d{8}$/,
    example: "11987654321 (11 digits with area code)",
  },
  {
    name: "Brunei",
    code: "+673",
    flag: "🇧🇳",
    regex: /^[2378]\d{6}$/,
    example: "8123456 (7 digits)",
  },
  {
    name: "Bulgaria",
    code: "+359",
    flag: "🇧🇬",
    regex: /^[879]\d{8}$/,
    example: "881234567 (9 digits)",
  },
  {
    name: "Cambodia",
    code: "+855",
    flag: "🇰🇭",
    regex: /^[1-9]\d{7,8}$/,
    example: "12345678",
  },
  {
    name: "Cameroon",
    code: "+237",
    flag: "🇨🇲",
    regex: /^[26]\d{8}$/,
    example: "671234567 (9 digits)",
  },
  {
    name: "Canada",
    code: "+1",
    flag: "🇨🇦",
    regex: /^\d{10}$/,
    example: "4161234567 (10 digits)",
  },
  {
    name: "China",
    code: "+86",
    flag: "🇨🇳",
    regex: /^1[3-9]\d{9}$/,
    example: "13812345678 (11 digits starting with 13-19)",
  },
  {
    name: "Colombia",
    code: "+57",
    flag: "🇨🇴",
    regex: /^3\d{9}$/,
    example: "3001234567 (10 digits starting with 3)",
  },
  {
    name: "Denmark",
    code: "+45",
    flag: "🇩🇰",
    regex: /^\d{8}$/,
    example: "20123456 (8 digits)",
  },
  {
    name: "Egypt",
    code: "+20",
    flag: "🇪🇬",
    regex: /^1[0125]\d{8}$/,
    example: "1012345678 (10 digits starting with 010, 011, 012, 015)",
  },
  {
    name: "Finland",
    code: "+358",
    flag: "🇫🇮",
    regex: /^[1-9]\d{8,9}$/,
    example: "401234567",
  },
  {
    name: "France",
    code: "+33",
    flag: "🇫🇷",
    regex: /^[67]\d{8}$/,
    example: "612345678 (9 digits starting with 6 or 7)",
  },
  {
    name: "Germany",
    code: "+49",
    flag: "🇩🇪",
    regex: /^1[567]\d{8,9}$/,
    example: "15123456789",
  },
  {
    name: "Greece",
    code: "+30",
    flag: "🇬🇷",
    regex: /^6\d{9}$/,
    example: "6912345678 (10 digits starting with 6)",
  },
  {
    name: "Hong Kong",
    code: "+852",
    flag: "🇭🇰",
    regex: /^[456789]\d{7}$/,
    example: "91234567 (8 digits)",
  },
  {
    name: "Hungary",
    code: "+36",
    flag: "🇭🇺",
    regex: /^[20|30|31|50|70]\d{7}$/,
    example: "301234567",
  },
  {
    name: "India",
    code: "+91",
    flag: "🇮🇳",
    regex: /^[6-9]\d{9}$/,
    example: "9876543210 (10 digits starting with 6-9)",
  },
  {
    name: "Indonesia",
    code: "+62",
    flag: "🇮🇩",
    regex: /^8\d{8,11}$/,
    example: "81234567890",
  },
  {
    name: "Iran",
    code: "+98",
    flag: "🇮🇷",
    regex: /^9\d{9}$/,
    example: "9123456789 (10 digits starting with 9)",
  },
  {
    name: "Iraq",
    code: "+964",
    flag: "🇮🇶",
    regex: /^7\d{9}$/,
    example: "7912345678 (10 digits starting with 7)",
  },
  {
    name: "Ireland",
    code: "+353",
    flag: "🇮🇪",
    regex: /^8\d{8}$/,
    example: "871234567 (9 digits starting with 8)",
  },
  {
    name: "Italy",
    code: "+39",
    flag: "🇮🇹",
    regex: /^3\d{8,9}$/,
    example: "3123456789",
  },
  {
    name: "Japan",
    code: "+81",
    flag: "🇯🇵",
    regex: /^[789]0\d{8}$/,
    example: "9012345678 (10 digits)",
  },
  {
    name: "Jordan",
    code: "+962",
    flag: "🇯🇴",
    regex: /^7\d{8}$/,
    example: "791234567 (9 digits starting with 7)",
  },
  {
    name: "Kuwait",
    code: "+965",
    flag: "🇰🇼",
    regex: /^[569]\d{7}$/,
    example: "50123456 (8 digits starting with 5, 6, or 9)",
  },
  {
    name: "Malaysia",
    code: "+60",
    flag: "🇲🇾",
    regex: /^1\d{8,9}$/,
    example: "123456789",
  },
  {
    name: "Maldives",
    code: "+960",
    flag: "🇲🇻",
    regex: /^[78]\d{6}$/,
    example: "7712345 (7 digits starting with 7 or 8)",
  },
  {
    name: "Mexico",
    code: "+52",
    flag: "🇲🇽",
    regex: /^\d{10}$/,
    example: "5512345678 (10 digits)",
  },
  {
    name: "Myanmar",
    code: "+95",
    flag: "🇲🇲",
    regex: /^9\d{7,8}$/,
    example: "912345678",
  },
  {
    name: "Nepal",
    code: "+977",
    flag: "🇳🇵",
    regex: /^9[678]\d{8}$/,
    example: "9812345678 (10 digits)",
  },
  {
    name: "Netherlands",
    code: "+31",
    flag: "🇳🇱",
    regex: /^6\d{8}$/,
    example: "612345678 (9 digits starting with 6)",
  },
  {
    name: "New Zealand",
    code: "+64",
    flag: "🇳🇿",
    regex: /^2\d{7,8}$/,
    example: "211234567",
  },
  {
    name: "Nigeria",
    code: "+234",
    flag: "🇳🇬",
    regex: /^[789]\d{9}$/,
    example: "8021234567 (10 digits)",
  },
  {
    name: "Norway",
    code: "+47",
    flag: "🇳🇴",
    regex: /^[49]\d{7}$/,
    example: "41234567 (8 digits)",
  },
  {
    name: "Oman",
    code: "+968",
    flag: "🇴🇲",
    regex: /^[79]\d{7}$/,
    example: "91234567 (8 digits)",
  },
  {
    name: "Pakistan",
    code: "+92",
    flag: "🇵🇰",
    regex: /^3\d{9}$/,
    example: "3001234567 (10 digits starting with 3)",
  },
  {
    name: "Philippines",
    code: "+63",
    flag: "🇵🇭",
    regex: /^9\d{9}$/,
    example: "9123456789 (10 digits starting with 9)",
  },
  {
    name: "Poland",
    code: "+48",
    flag: "🇵🇱",
    regex: /^[45678]\d{8}$/,
    example: "501234567 (9 digits)",
  },
  {
    name: "Portugal",
    code: "+351",
    flag: "🇵🇹",
    regex: /^9[1236]\d{7}$/,
    example: "912345678 (9 digits)",
  },
  {
    name: "Qatar",
    code: "+974",
    flag: "🇶🇦",
    regex: /^[3567]\d{7}$/,
    example: "55123456 (8 digits)",
  },
  {
    name: "Romania",
    code: "+40",
    flag: "🇷🇴",
    regex: /^7\d{8}$/,
    example: "712345678 (9 digits starting with 7)",
  },
  {
    name: "Russia",
    code: "+7",
    flag: "🇷🇺",
    regex: /^9\d{9}$/,
    example: "9123456789 (10 digits starting with 9)",
  },
  {
    name: "Saudi Arabia",
    code: "+966",
    flag: "🇸🇦",
    regex: /^5\d{8}$/,
    example: "501234567 (9 digits starting with 5)",
  },
  {
    name: "Singapore",
    code: "+65",
    flag: "🇸🇬",
    regex: /^[89]\d{7}$/,
    example: "81234567 (8 digits starting with 8 or 9)",
  },
  {
    name: "South Africa",
    code: "+27",
    flag: "🇿🇦",
    regex: /^[678]\d{8}$/,
    example: "821234567 (9 digits)",
  },
  {
    name: "South Korea",
    code: "+82",
    flag: "🇰🇷",
    regex: /^1[016789]\d{7,8}$/,
    example: "1012345678",
  },
  {
    name: "Spain",
    code: "+34",
    flag: "🇪🇸",
    regex: /^[67]\d{8}$/,
    example: "612345678 (9 digits starting with 6 or 7)",
  },
  {
    name: "Sri Lanka",
    code: "+94",
    flag: "🇱🇰",
    regex: /^7\d{8}$/,
    example: "712345678 (9 digits starting with 7)",
  },
  {
    name: "Sweden",
    code: "+46",
    flag: "🇸🇪",
    regex: /^7\d{8}$/,
    example: "701234567 (9 digits starting with 7)",
  },
  {
    name: "Switzerland",
    code: "+41",
    flag: "🇨🇭",
    regex: /^7[5689]\d{7}$/,
    example: "791234567 (9 digits)",
  },
  {
    name: "Taiwan",
    code: "+886",
    flag: "🇹🇼",
    regex: /^9\d{8}$/,
    example: "912345678 (9 digits starting with 9)",
  },
  {
    name: "Thailand",
    code: "+66",
    flag: "🇹🇭",
    regex: /^[689]\d{8}$/,
    example: "812345678 (9 digits)",
  },
  {
    name: "Turkey",
    code: "+90",
    flag: "🇹🇷",
    regex: /^5\d{9}$/,
    example: "5012345678 (10 digits starting with 5)",
  },
  {
    name: "Ukraine",
    code: "+380",
    flag: "🇺🇦",
    regex: /^[3569]\d{8}$/,
    example: "501234567 (9 digits)",
  },
  {
    name: "United Arab Emirates",
    code: "+971",
    flag: "🇦🇪",
    regex: /^5\d{8}$/,
    example: "501234567 (9 digits starting with 5)",
  },
  {
    name: "United Kingdom",
    code: "+44",
    flag: "🇬🇧",
    regex: /^7\d{9}$/,
    example: "7911123456 (10 digits starting with 7)",
  },
  {
    name: "United States",
    code: "+1",
    flag: "🇺🇸",
    regex: /^\d{10}$/,
    example: "2025550143 (10 digits)",
  },
  {
    name: "Vietnam",
    code: "+84",
    flag: "🇻🇳",
    regex: /^(3|5|7|8|9)\d{8}$/,
    example: "912345678 (9 digits)",
  },
  {
    name: "Yemen",
    code: "+967",
    flag: "🇾🇪",
    regex: /^7\d{8}$/,
    example: "712345678 (9 digits starting with 7)",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lang, setLang] = useState<"EN" | "BN">("EN");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // কান্ট্রি ড্রপডাউন কন্ট্রোল করার স্টেট
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // OTP ও মেথড সিলেকশন স্টেটসমূহ
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"email" | "phone">("email");
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

  // ড্রপডাউনের বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হয়ে যাওয়ার লজিক
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // সার্চ ফিল্টার অনুযায়ী দেশ ফিল্টার করা
  const filteredCountries = countriesList.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch),
  );

  // কঠোর ফোন নম্বর প্যাটার্ন (Regex) ভ্যালিডেশন চেক করার ফাংশন
  const validatePhonePattern = () => {
    const selectedCountryObj = countriesList.find(
      (c) => c.name === formData.countryName,
    );

    if (!selectedCountryObj) return true;

    const cleanPhone = formData.phone.trim();

    // দেশের নিজস্ব রেজেক্স দিয়ে চেক করা হচ্ছে
    if (!selectedCountryObj.regex.test(cleanPhone)) {
      setErrorMessage(
        `Invalid phone number format for ${selectedCountryObj.name}! Expected format: ${selectedCountryObj.example}`,
      );
      return false;
    }
    return true;
  };

  // ১. রেজিস্ট্রেশন সাবমিট করলে আগে ফোন নম্বর সঠিক প্যাটার্নে আছে কিনা চেক হবে
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setMethodNotice("");

    // পাসওয়ার্ড ম্যাচ চেক
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    // কান্ট্রি ওয়াইজ ফোন নম্বর সঠিক প্যাটার্ন মেনেছে কি না চেক
    if (!validatePhonePattern()) {
      return;
    }

    setIsMethodModalOpen(true);
  };

  // ২. মাধ্যম কনফার্ম করার পর OTP পাঠাবে
  const handleSendOtp = async () => {
    setMethodNotice("");
    setErrorMessage("");

    if (otpMethod === "phone") {
      setMethodNotice(
        "সাময়িক সময়ের জন্য আমাদের SMS সার্ভিস বন্ধ রয়েছে। দয়া করে Gmail সিলেক্ট করে OTP কোডটি সংগ্রহ করুন।",
      );
      return;
    }

    setLoading(true);

    try {
      const endpoint = "http://localhost:5000/api/auth/send-email-otp";
      const payload = {
        email: formData.email,
        phoneNumber: formData.phone,
        country: `${formData.countryName} (${formData.countryCode})`,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP!");
      }

      setIsMethodModalOpen(false);
      setIsOtpModalOpen(true);
    } catch (error: any) {
      setMethodNotice(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ৩. OTP ইনপুট দেওয়ার পর ফাইনাল রেজিস্ট্রেশন সম্পন্ন করবে
  const handleVerifyAndRegister = async () => {
    setOtpError("");
    if (!otp || otp.length < 6) {
      setOtpError("Please enter a valid 6-digit OTP!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: `${formData.countryName} (${formData.countryCode})`,
          phoneNumber: formData.phone,
          email: formData.email,
          fullName: formData.fullName,
          district: formData.district,
          password: formData.password,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed!");
      }

      alert("Registration successful!");
      setIsOtpModalOpen(false);
      router.push("/login");
    } catch (error: any) {
      setOtpError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans overflow-x-hidden relative">
      {/* ---------------- LEFT SIDE: DARK HERO SECTION ---------------- */}
      <div className="lg:w-1/2 bg-[#222835] min-h-[400px] lg:min-h-screen flex flex-col items-center justify-center p-6 lg:p-8 relative overflow-hidden">
        <div className="relative w-full max-w-[620px] aspect-square flex items-center justify-center">
          <img
            src="https://app.sohozkaj.com/images/authImage.svg"
            alt="SohozKaj Workflow Illustration"
            className="w-full h-full object-contain z-10 drop-shadow-2xl scale-105"
          />
        </div>

        <div className="mt-2 text-center w-full max-w-[680px] z-10 px-2">
          <p className="text-gray-300 text-xs sm:text-sm font-normal leading-relaxed">
            <span className="block whitespace-nowrap">
              Create documents, designs, and print media with photo editing, AI
              photo editing, manual editing, and bulk editing -
            </span>
            <span className="block mt-1">easy to use.</span>
          </p>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE: REGISTER FORM SECTION ---------------- */}
      <div className="lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative bg-white">
        <div className="flex justify-between items-center w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#FF5D00] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-md text-xs font-semibold">
            <button
              onClick={() => setLang("EN")}
              className={`px-3 py-1 rounded transition-all ${
                lang === "EN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("BN")}
              className={`px-3 py-1 rounded transition-all ${
                lang === "BN"
                  ? "bg-[#FF5D00] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              বাং
            </button>
          </div>
        </div>

        <div className="w-full max-w-xl mx-auto my-auto py-6">
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-1.5 group">
              <div className="w-9 h-9 bg-[#FF5D00] rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                SK
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tight text-gray-900">
                  Sohoz<span className="text-[#FF5D00]">kaj</span>
                </span>
                <span className="text-[9px] tracking-widest text-gray-400 font-bold uppercase mt-0.5">
                  WWW.SOHOZKAJ.COM
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 font-medium">
              Create your account
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/60 p-6 sm:p-8 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5D00] to-orange-300 rounded-t-2xl" />

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ---------------- CUSTOM COUNTRY SEARCH DROPDOWN ---------------- */}
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-xs font-semibold text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>

                  <div
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 flex items-center justify-between cursor-pointer focus:border-[#FF5D00] transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm">{formData.countryFlag}</span>
                      <span className="truncate">
                        {formData.countryName} ({formData.countryCode})
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${
                        isCountryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isCountryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 max-h-60 flex flex-col">
                      <div className="relative mb-2">
                        <Search
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#FF5D00]"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto space-y-0.5 max-h-44 pr-1">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <div
                              key={c.name}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  countryName: c.name,
                                  countryCode: c.code,
                                  countryFlag: c.flag,
                                });
                                setIsCountryOpen(false);
                                setCountrySearch("");
                              }}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                formData.countryName === c.name
                                  ? "bg-orange-50 text-[#FF5D00] font-bold"
                                  : "hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{c.flag}</span>
                                <span>{c.name}</span>
                              </div>
                              <span className="text-gray-400 font-medium">
                                {c.code}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3 text-xs text-gray-400">
                            No country found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Write number without country code"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Email{" "}
                    <span className="text-gray-400 font-normal">
                      (required)
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  District <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400 pointer-events-none">
                    <MapPin size={15} />
                  </div>
                  <select
                    required
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#FF5D00] transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      e.g. Dhaka
                    </option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Bogura">Bogura</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barishal">Barishal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                  <span className="absolute right-3 pointer-events-none text-gray-400 text-xs">
                    ▼
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#FF5D00] hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5D00] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 text-[#FF5D00] hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreeTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, agreeTerms: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#FF5D00] focus:ring-[#FF5D00]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-[#FF5D00] font-semibold hover:underline"
                    >
                      Terms & Conditions
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF5D00] hover:bg-[#e05200] disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-orange-500/20 active:scale-[0.99] mt-2"
              >
                Register
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#FF5D00] font-bold hover:underline ml-0.5"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50">
          <a
            href="https://wa.me/8801700559595"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            title="Chat with Support"
          >
            <MessageCircle size={26} className="fill-current" />
          </a>
        </div>
      </div>

      {/* ---------------- 2. OTP METHOD SELECTION MODAL ---------------- */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsMethodModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-[#FF5D00] rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                ভেরিফিকেশন মাধ্যম বেছে নিন
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                আপনি কোথায় OTP কোডটি পেতে চান?
              </p>

              {methodNotice && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-left flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="leading-tight font-medium">{methodNotice}</p>
                </div>
              )}

              <div className="space-y-3 mb-6 text-left">
                <label
                  onClick={() => {
                    setOtpMethod("email");
                    setMethodNotice("");
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    otpMethod === "email"
                      ? "border-[#FF5D00] bg-orange-50/60 text-gray-900 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="otpMethod"
                    checked={otpMethod === "email"}
                    onChange={() => {
                      setOtpMethod("email");
                      setMethodNotice("");
                    }}
                    className="accent-[#FF5D00] w-4 h-4"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-800">
                      Gmail (ইমেইল)
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {formData.email || "example@gmail.com"}
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setOtpMethod("phone")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    otpMethod === "phone"
                      ? "border-[#FF5D00] bg-orange-50/60 text-gray-900 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="otpMethod"
                    checked={otpMethod === "phone"}
                    onChange={() => setOtpMethod("phone")}
                    className="accent-[#FF5D00] w-4 h-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Phone (ফোন নম্বর)
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {formData.countryCode} {formData.phone || "017XXXXXXXX"}
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 bg-[#FF5D00] hover:bg-[#e05200] text-white font-bold text-xs rounded-lg shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. OTP INPUT POPUP MODAL ---------------- */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-100 text-[#FF5D00] rounded-full flex items-center justify-center mb-3">
                <KeyRound size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Verification Code Sent
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                We've sent a 6-digit OTP code to{" "}
                <span className="font-semibold text-gray-800">
                  {otpMethod === "email" ? formData.email : formData.phone}
                </span>
              </p>

              {otpError && (
                <div className="w-full mt-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg text-center font-medium">
                  {otpError}
                </div>
              )}

              <div className="w-full my-5">
                <label className="block text-left text-xs font-medium text-gray-700 mb-1">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF5D00] transition-colors"
                />
              </div>

              <button
                onClick={handleVerifyAndRegister}
                disabled={loading}
                className="w-full py-3 bg-[#FF5D00] hover:bg-[#e05200] text-white font-bold text-xs rounded-lg shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </button>

              <button
                onClick={handleSendOtp}
                type="button"
                className="mt-3 text-xs text-gray-500 hover:text-[#FF5D00] font-medium transition-colors"
              >
                Didn't receive code? Resend OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
