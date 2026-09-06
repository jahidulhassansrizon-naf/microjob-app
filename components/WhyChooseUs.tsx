import {
  Clock,
  ShieldCheck,
  ThumbsUp,
  Headphones,
  Zap,
  Bookmark,
} from "lucide-react";

export default function WhyChooseUs() {
  const benefits = [
    {
      title: "File sharing without USB drives",
      desc: "Your time is valuable, so we deliver service as fast as possible.",
      icon: <Clock className="text-[#3B82F6]" size={20} />,
      iconBg: "bg-blue-50",
    },
    {
      title: "Cybersecurity & permissions",
      desc: "Control access for multiple employees in your office or shop",
      icon: <ShieldCheck className="text-[#10B981]" size={20} />,
      iconBg: "bg-emerald-50",
    },
    {
      title: "Instant search & tags",
      desc: "A simple and beautiful interface that anyone can use with ease.",
      icon: <ThumbsUp className="text-[#8B5CF6]" size={20} />,
      iconBg: "bg-purple-50",
    },
    {
      title: "Fast search system",
      desc: "Quickly find edited or printed files by name, date and category",
      icon: <Headphones className="text-[#F97316]" size={20} />,
      iconBg: "bg-orange-50",
    },
    {
      title: "Pin your favorite files",
      desc: "Pin favorite files/templates for quick access",
      icon: <Zap className="text-[#EAB308]" size={20} />,
      iconBg: "bg-yellow-50",
    },
    {
      title: "Direct save, print & email",
      desc: "Save, print, or even send created files directly to a customer's email",
      icon: <Bookmark className="text-[#EC4899]" size={20} />,
      iconBg: "bg-pink-50",
    },
  ];

  return (
    <section className="bg-[#F8F9FA] py-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            Why Choose Us
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-[1.15]">
            <span className="text-[#FF5D00]">Easy to use,</span> and more <br />
            benefits
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-1">
            We provide fast, safe, and reliable solutions to simplify your daily
            work
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[28px] p-7 border border-gray-100 shadow-xs flex flex-col justify-start min-h-[190px] transition hover:shadow-md"
            >
              <div
                className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center mb-5`}
              >
                {item.icon}
              </div>

              <h3 className="text-lg font-bold text-gray-950 mb-2 tracking-tight leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
