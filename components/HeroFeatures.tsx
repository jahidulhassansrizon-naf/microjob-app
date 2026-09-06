import { Sparkles, Edit3, FileText, Briefcase, Wrench } from "lucide-react";

export default function HeroFeatures() {
  const features = [
    {
      title: "AI Photo Edit",
      value: "20 sec",
      subtitle: "Photo ready",
      bgColor: "bg-gray-900",
      icon: <Sparkles className="text-amber-400" size={24} />,
    },
    {
      title: "Manual Photo Edit",
      value: "Your way",
      subtitle: "Edit freely",
      bgColor: "bg-sky-500",
      icon: <Edit3 className="text-white" size={24} />,
    },
    {
      title: "Create Documents",
      value: "500+",
      subtitle: "Document files",
      bgColor: "bg-purple-600",
      icon: <FileText className="text-white" size={24} />,
    },
    {
      title: "Job Circular",
      value: "Daily",
      subtitle: "New updates",
      bgColor: "bg-amber-500",
      icon: <Briefcase className="text-white" size={24} />,
    },
    {
      title: "Easy Tools",
      value: "56+",
      subtitle: "Free tools",
      bgColor: "bg-rose-500",
      icon: <Wrench className="text-white" size={24} />,
    },
  ];

  return (
    <section className="w-full pt-12 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Top 5 Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-20">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100/80 shadow-sm flex flex-col items-center text-center relative pt-12 mt-6 hover:-translate-y-1 transition duration-300"
            >
              {/* Floating Square Icon */}
              <div
                className={`absolute -top-6 w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center shadow-md`}
              >
                {item.icon}
              </div>

              <h4 className="text-xs font-bold text-gray-700 mb-4">
                {item.title}
              </h4>

              <p className="text-2xl font-black text-gray-950 tracking-tight">
                {item.value}
              </p>
              <span className="text-[11px] font-medium text-gray-400 mt-1">
                {item.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Section Heading Area */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
            <Sparkles size={14} />
            <span>AI Photoshop</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-gray-950 tracking-tight leading-[1.15]">
            Create <span className="text-[#FC4D0B]">professional photos</span>{" "}
            faster <br className="hidden sm:inline" />
            and more precisely
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-2">
            Create professional photos from normal images in just a few seconds
            without Photoshop, using ShohozKaj.
          </p>
        </div>
      </div>
    </section>
  );
}
