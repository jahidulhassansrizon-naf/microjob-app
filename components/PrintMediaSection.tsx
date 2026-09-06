import {
  LayoutGrid,
  FileEdit,
  Image,
  ArrowRight,
  Printer,
  Share2,
  FolderDown,
} from "lucide-react";

export default function PrintMediaSection() {
  const cards = [
    {
      title: "Massive print-ready design library",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <LayoutGrid className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
    {
      title: "Replace text in a flash",
      desc: "Create, edit and print with different information all at once",
      icon: <FileEdit className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
    {
      title: "Replace logos, images and other photos",
      desc: "This huge collection of various categories (AI, PSD & preview) is completely free",
      icon: <Image className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
    {
      title: "Create your file instantly",
      desc: "Create your file easily in the print media service.",
      icon: <ArrowRight className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
    {
      title: "Share or email your created file",
      desc: "Instantly download or email your created file at any time.",
      icon: <Printer className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
    {
      title: "AI, PSD, PNG, CMYK, RGB — whatever you need",
      desc: "Save the final version in any format with one click.",
      icon: <FolderDown className="text-white" size={20} />,
      iconBg: "bg-[#7C3AED]",
    },
  ];

  return (
    <section className="bg-[#FAF7FD] py-20 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center bg-orange-100/70 border border-orange-200/80 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
            Our Print Service
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-[1.15]">
            SohozKaj-Professional <br />
            <span className="text-[#FF5D00]">Print Media</span>
            <span className="text-gray-950">Solution</span>
          </h2>

          <p className="text-gray-500 font-medium text-sm md:text-base max-w-lg mx-auto pt-1">
            Banners, flyers, posters, business cards and more — quality print
            services for your brand.
          </p>
        </div>

        {/* 6 Cards Grid (2 rows x 3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[28px] p-7 border border-purple-50 shadow-xs flex flex-col justify-between min-h-[220px] transition hover:shadow-md"
            >
              <div>
                <div
                  className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-xs`}
                >
                  {card.icon}
                </div>

                <h3 className="text-lg font-bold text-gray-950 mb-2 tracking-tight leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-5">
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] hover:underline"
                >
                  <span>Learn more</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Special Offer CTA Banner */}
        <div className="w-full bg-gradient-to-r from-[#8B00FF] via-[#5B32F3] to-[#0066FF] rounded-[36px] py-14 px-6 md:px-12 text-center text-white shadow-2xl shadow-purple-900/20 relative overflow-hidden flex flex-col items-center">
          <div className="inline-block bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            Special Offer
          </div>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-2xl mb-4">
            Start Today with SohozKaj - Completely Free
          </h2>

          <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl mb-8">
            Document creation, print media, professional photo creation —
            everything included.
          </p>

          <button className="bg-white text-[#7C3AED] hover:bg-gray-50 font-bold px-8 py-3.5 rounded-full text-sm inline-flex items-center gap-2 shadow-lg transition hover:scale-105">
            <span>Get Started Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
