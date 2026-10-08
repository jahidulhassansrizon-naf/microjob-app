"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useMemo, useState } from "react";
import Footer from "@/components/Footer";
type TeamItem = {
    id: number;
    name: string;
    role: string;
    category: "Leadership" | "Development" | "Customer Team" | "Support" | "Group photos";
    wide?: boolean;
};
const filters = [
    "All",
    "Leadership",
    "Development",
    "Customer Team",
    "Support",
    "Group photos",
] as const;
type Filter = (typeof filters)[number];
const team: TeamItem[] = [
    {
        id: 1,
        name: "Name will be updated soon...",
        role: "Group photos",
        category: "Group photos",
        wide: true,
    },
    {
        id: 2,
        name: "Name will be updated soon...",
        role: "Founder and CEO",
        category: "Leadership",
    },
    {
        id: 3,
        name: "Name will be updated soon...",
        role: "CTO",
        category: "Leadership",
    },
    {
        id: 4,
        name: "Name will be updated soon...",
        role: "Lead Developer",
        category: "Development",
    },
    {
        id: 5,
        name: "Name will be updated soon...",
        role: "Developer",
        category: "Development",
    },
    {
        id: 6,
        name: "Name will be updated soon...",
        role: "Development",
        category: "Development",
        wide: true,
    },
    {
        id: 7,
        name: "Name will be updated soon...",
        role: "Group photos",
        category: "Group photos",
        wide: true,
    },
    {
        id: 8,
        name: "Name will be updated soon...",
        role: "Developer",
        category: "Development",
    },
    {
        id: 9,
        name: "Name will be updated soon...",
        role: "Customer Support",
        category: "Customer Team",
    },
    {
        id: 10,
        name: "Name will be updated soon...",
        role: "Developer",
        category: "Development",
    },
    {
        id: 11,
        name: "Name will be updated soon...",
        role: "Customer Support",
        category: "Customer Team",
    },
    {
        id: 12,
        name: "Name will be updated soon...",
        role: "Video editing",
        category: "Support",
    },
    {
        id: 13,
        name: "Name will be updated soon...",
        role: "Customer Support",
        category: "Customer Team",
    },
    {
        id: 14,
        name: "Name will be updated soon...",
        role: "Group photos",
        category: "Group photos",
        wide: true,
    },
    {
        id: 15,
        name: "Name will be updated soon...",
        role: "Content",
        category: "Support",
    },
    {
        id: 16,
        name: "Name will be updated soon...",
        role: "Customer Team",
        category: "Customer Team",
    },
    {
        id: 17,
        name: "Name will be updated soon...",
        role: "Customer Team",
        category: "Customer Team",
    },
    {
        id: 18,
        name: "Name will be updated soon...",
        role: "Marketing",
        category: "Support",
    },
    {
        id: 19,
        name: "Name will be updated soon...",
        role: "Group photos",
        category: "Group photos",
        wide: true,
    },
    {
        id: 20,
        name: "Name will be updated soon...",
        role: "Group photos",
        category: "Group photos",
    },
];
function ArrowIcon() {
    return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 16 16 8M10 8h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
function HomeIcon() {
    return (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>);
}
function PhotoBadge() {
    return (<span className="photo-badge" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M8 7h8l1.3 2H20a1 1 0 0 1 1 1v9H3v-9a1 1 0 0 1 1-1h2.7L8 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    </span>);
}
function PhotoPlaceholderIcon() {
    return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>);
}
export default function OurTeamPage() {
    const [activeFilter, setActiveFilter] = useState<Filter>("All");
    const visibleTeam = useMemo(() => {
        if (activeFilter === "All")
            return team;
        return team.filter((member) => member.category === activeFilter);
    }, [activeFilter]);
    return (<>
      <main className="team-page">
        <section className="team-shell">
          <header className="page-header">
            <div className="header-topline">
              <div className="crumbs">
                <span className="crumb-home">
                  <HomeIcon />
                </span>
                <span><T>{"Bay City"}</T></span>
                <span className="crumb-separator"><T>{"\u203A"}</T></span>
                <strong><T>{"Our Team"}</T></strong>
              </div>

              <a className="back-link" href="/">
                <ArrowIcon />
                <span><T>{"Return to homepage"}</T></span>
              </a>
            </div>

            <div className="title-row">
              <div className="title-left">
                <div className="title-icon" aria-hidden="true">
                  <span />
                </div>
                <div>
                  <h1><T>{"Our Team"}</T></h1>
                  <p><T>{"The people behind every pixel \u2014 product &amp; passion and\r\n                    team moments.\r\n                  "}</T></p>
                </div>
              </div>

              <span className="picture-count">
                <span className="count-dot"/> {team.length}<T>{"members\r\n              "}</T></span>
            </div>
          </header>

          <div className="filter-bar">
            <div className="filter-row">
              {filters.map((filter) => (<button key={filter} type="button" className={`filter-pill ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </button>))}
            </div>
            <span className="result-count">{visibleTeam.length}<T>{"members"}</T></span>
          </div>

          <section className="gallery" aria-label="Our team members">
            {visibleTeam.map((member) => (<article key={member.id} className={`team-card ${member.wide ? "wide" : ""}`}>
                <div className="photo-wrap">
                  <div className="photo-placeholder">
                    <PhotoPlaceholderIcon />
                    <span><T>{"Photo will be added soon..."}</T></span>
                  </div>
                  <PhotoBadge />
                </div>

                <div className="card-copy">
                  <h2 className="italic text-slate-400 font-normal">
                    {member.name}
                  </h2>
                  <p>
                    <span className="role-bullet"/>
                    {member.role}
                  </p>
                </div>
              </article>))}
          </section>
        </section>

        <style jsx global>{`
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            min-height: 100%;
          }

          body {
            background: #f8fafc;
            color: #0f172a;
            font-family:
              Inter,
              ui-sans-serif,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            -webkit-font-smoothing: antialiased;
          }

          button,
          a {
            font: inherit;
          }

          .team-page {
            width: 100%;
            min-height: 100vh;
            padding: 18px 16px 42px;
            background:
              radial-gradient(
                circle at top left,
                rgba(37, 99, 235, 0.035),
                transparent 27%
              ),
              #f8fafc;
          }

          .team-shell {
            width: min(1120px, 100%);
            margin: 0 auto;
          }

          .page-header {
            padding: 2px 0 20px;
            border-bottom: 1px solid #e2e8f0;
          }

          .header-topline,
          .title-row,
          .filter-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
          }

          .header-topline {
            min-height: 22px;
          }

          .crumbs {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .crumbs strong {
            color: #0f172a;
            font-weight: 800;
          }

          .crumb-home {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
          }

          .crumb-separator {
            color: #cbd5e1;
            font-size: 15px;
            transform: translateY(-1px);
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #64748b;
            text-decoration: none;
            font-size: 11px;
            font-weight: 700;
            transition: color 160ms ease;
          }

          .back-link:hover {
            color: #2563eb;
          }

          .title-row {
            margin-top: 17px;
          }

          .title-left {
            display: flex;
            align-items: center;
            gap: 13px;
            min-width: 0;
          }

          .title-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            border-radius: 10px;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, #eff6ff, #dbeafe);
            border: 1px solid #bfdbfe;
            box-shadow: 0 2px 5px rgba(37, 99, 235, 0.05);
          }

          .title-icon span {
            width: 8px;
            height: 8px;
            border-radius: 3px;
            background: #2563eb;
            box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1);
          }

          h1 {
            margin: 0;
            font-size: clamp(22px, 2.2vw, 27px);
            line-height: 1;
            letter-spacing: -0.035em;
            color: #0f172a;
            font-weight: 850;
          }

          .title-left p {
            margin: 6px 0 0;
            color: #64748b;
            font-size: 11px;
            line-height: 1.35;
            font-weight: 600;
          }

          .picture-count {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #2563eb;
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            border-radius: 999px;
            padding: 8px 11px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          .count-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #2563eb;
          }

          .filter-bar {
            padding: 16px 0 14px;
            border-bottom: 1px solid #e2e8f0;
          }

          .filter-row {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
          }

          .filter-pill {
            border: 1px solid #cbd5e1;
            background: #fff;
            color: #475569;
            min-height: 31px;
            padding: 7px 14px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
            line-height: 1;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
            transition:
              transform 140ms ease,
              border-color 140ms ease,
              background 140ms ease,
              color 140ms ease,
              box-shadow 140ms ease;
          }

          .filter-pill:hover {
            transform: translateY(-1px);
            border-color: #94a3b8;
            box-shadow: 0 5px 12px rgba(15, 23, 42, 0.05);
          }

          .filter-pill.active {
            color: #fff;
            background: #2563eb;
            border-color: #2563eb;
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
          }

          .result-count {
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          .gallery {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            grid-auto-flow: row dense;
            gap: 10px;
            padding-top: 16px;
          }

          .team-card {
            min-width: 0;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 5px rgba(15, 23, 42, 0.04);
            transition:
              border-color 200ms ease,
              box-shadow 200ms ease;
          }

          .team-card:hover {
            border-color: #bfdbfe;
            box-shadow: 0 6px 14px rgba(37, 99, 235, 0.08);
          }

          .team-card.wide {
            grid-column: span 2;
          }

          .photo-wrap {
            position: relative;
            height: 174px;
            overflow: hidden;
            background: #f1f5f9;
          }

          .photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 600;
            font-style: italic;
            padding: 12px;
            text-align: center;
            user-select: none;
          }

          .photo-badge {
            position: absolute;
            top: 7px;
            right: 7px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            border-radius: 7px;
            color: #475569;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 7px rgba(15, 23, 42, 0.1);
            backdrop-filter: blur(3px);
          }

          .card-copy {
            padding: 9px 10px 10px;
          }

          .card-copy h2 {
            margin: 0;
            font-size: 11px;
            line-height: 1.22;
            letter-spacing: -0.015em;
          }

          .card-copy p {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 5px 0 0;
            color: #64748b;
            font-size: 9px;
            line-height: 1.15;
            font-weight: 700;
          }

          .role-bullet {
            width: 5px;
            height: 5px;
            flex: 0 0 5px;
            border-radius: 2px;
            background: #2563eb;
          }

          @media (max-width: 860px) {
            .gallery {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .team-card.wide {
              grid-column: span 2;
            }
          }

          @media (max-width: 560px) {
            .team-page {
              padding: 12px 11px 32px;
            }

            .header-topline,
            .title-row,
            .filter-bar {
              align-items: flex-start;
            }

            .header-topline {
              flex-direction: column;
            }

            .back-link {
              align-self: flex-end;
            }

            .title-row,
            .filter-bar {
              flex-direction: column;
            }

            .picture-count,
            .result-count {
              align-self: flex-end;
            }

            .filter-bar {
              gap: 11px;
            }

            .filter-row {
              width: 100%;
            }

            .gallery {
              grid-template-columns: minmax(0, 1fr);
              gap: 9px;
            }

            .team-card.wide {
              grid-column: span 1;
            }

            .photo-wrap {
              height: 230px;
            }
          }
        `}</style>
      </main>
      <Footer />
    </>);
}
