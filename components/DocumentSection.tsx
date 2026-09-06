import {
  FileEdit,
  FileText,
  Send,
  ArrowRight,
  FileCheck,
  Eye,
  Keyboard,
} from "lucide-react";

export default function DocumentSection() {
  const cards = [
    {
      title: "Update information in a flash",
      desc: "Change information in up to 50 pages of paper through a simple form.",
      badge: "AI Powered",
      badgeStyle: "bg-emerald-100/70 text-emerald-700 border-emerald-200",
      iconBg: "bg-[#05B066]",
      icon: <FileEdit className="text-white" size={22} />,
      btnColor: "text-[#05B066]",
      arrowBg: "bg-[#05B066]",
    },
    {
      title: "Export files as PDF",
      desc: "Save and download your created file as PDF.",
      badge: "Popular",
      badgeStyle: "bg-orange-100/70 text-orange-700 border-orange-200",
      iconBg: "bg-[#F95700]",
      icon: <FileText className="text-white" size={22} />,
      btnColor: "text-[#F95700]",
      arrowBg: "bg-[#F95700]",
    },
    {
      title: "Share or email your document",
      desc: "Download or email your created document instantly, anytime.",
      badge: "Secure",
      badgeStyle: "bg-purple-100/70 text-purple-700 border-purple-200",
      iconBg: "bg-[#8B3DFF]",
      icon: <Send className="text-white" size={22} />,
      btnColor: "text-[#8B3DFF]",
      arrowBg: "bg-[#8B3DFF]",
    },
  ];

  const extraFeatures = [
    {
      title: "Multiple page sizes & formats",
      desc: "Set custom margins and sizes — A4, A5, Deed, and more.",
      iconBg: "bg-[#FF5314]",
      icon: <FileCheck className="text-white" size={20} />,
      arrowBg: "bg-[#FF5314]",
    },
    {
      title: "Document preview system",
      desc: "Preview your document before downloading as PDF.",
      iconBg: "bg-[#D926B5]",
      icon: <Eye className="text-white" size={20} />,
      arrowBg: "bg-[#D926B5]",
    },
    {
      title: "Keyboard shortcuts to save time",
      desc: "Do everything quickly with just the keyboard, no mouse needed.",
      iconBg: "bg-[#0088FF]",
      icon: <Keyboard className="text-white" size={20} />,
      arrowBg: "bg-[#0088FF]",
    },
  ];

  return (
    <section className="bg-[#F8F9FA] py-16 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            Document Creation
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-[1.2]">
            In Sohozkaj contracts & documents{" "}
            <br className="hidden sm:inline" />
            <span className="text-gray-950">instantly</span>
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto pt-1">
            Change text in contracts and other papers in moments through a
            simple form
          </p>
        </div>

        {/* 3 Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xs flex flex-col justify-between min-h-[290px] relative transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-xs`}
                  >
                    {card.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${card.badgeStyle}`}
                  >
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-950 mb-3 tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-6">
                <a
                  href="#"
                  className={`inline-flex items-center gap-2 text-xs font-bold ${card.btnColor} transition group`}
                >
                  <span>Learn more</span>
                  <div
                    className={`w-5 h-5 ${card.arrowBg} text-white rounded-full flex items-center justify-center transition group-hover:translate-x-0.5`}
                  >
                    <ArrowRight size={12} strokeWidth={3} />
                  </div>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* And More Container */}
        <div className="bg-[#F0F2F5]/80 rounded-[36px] p-8 md:p-10 border border-gray-200/50 flex flex-col items-center">
          <h3 className="text-2xl font-black text-gray-950 mb-1 tracking-tight">
            And more
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-8">
            Extra features that make your work even easier
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
            {extraFeatures.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100/80 shadow-2xs flex items-center justify-between gap-3 transition hover:shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 ${item.arrowBg} text-white rounded-full flex items-center justify-center shrink-0`}
                >
                  <ArrowRight size={11} strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
