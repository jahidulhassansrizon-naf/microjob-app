"use client";

import { useMemo, useState } from "react";
import Footer from "@/components/Footer";

type TeamItem = {
  id: number;
  name: string;
  role: string;
  category:
    | "Leadership"
    | "Development"
    | "Customer Team"
    | "Support"
    | "Group photos";
  image: string;
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
    name: "Sahajaka Team — 2025",
    role: "Group photos",
    category: "Group photos",
    image: "https://files.sohozkaj.com/teams/sohozkaj-team-4.webp",
    wide: true,
  },
  {
    id: 2,
    name: "Salim Rana",
    role: "Founder and CEO",
    category: "Leadership",
    image: "https://files.sohozkaj.com/teams/sohozkaj-ceo.webp",
  },
  {
    id: 3,
    name: "Al Imran",
    role: "CTO",
    category: "Leadership",
    image: "https://files.sohozkaj.com/teams/sohozkaj-cto.webp",
  },
  {
    id: 4,
    name: "Arkam Hossain",
    role: "Lead Developer",
    category: "Development",
    image: "https://files.sohozkaj.com/teams/sohozkaj-dev-team-3.webp",
  },
  {
    id: 5,
    name: "Arafat Akash",
    role: "Developer",
    category: "Development",
    image: "https://files.sohozkaj.com/teams/sohozkaj-dev-team-2.webp",
  },
  {
    id: 6,
    name: "Development Team",
    role: "Development",
    category: "Development",
    image: "https://files.sohozkaj.com/teams/sohozkaj-dev-team-1.webp",
    wide: true,
  },
  {
    id: 7,
    name: "Sahajaka Team",
    role: "Group photos",
    category: "Group photos",
    image: "https://files.sohozkaj.com/teams/sohozkaj-team-2.webp",
    wide: true,
  },
  {
    id: 8,
    name: "Shamim Hasan",
    role: "Developer",
    category: "Development",
    image: "https://files.sohozkaj.com/teams/shamim-dev.webp",
  },
  {
    id: 9,
    name: "Tanjidul Islam Shakib",
    role: "Customer Support",
    category: "Customer Team",
    image: "https://files.sohozkaj.com/teams/sohozkaj-support-1.webp",
  },
  {
    id: 10,
    name: "Tajbir Alam",
    role: "Developer",
    category: "Development",
    image: "https://files.sohozkaj.com/teams/sohozkaj-tazbir.webp",
  },
  {
    id: 11,
    name: "Habib Ali",
    role: "Customer Support",
    category: "Customer Team",
    image: "https://files.sohozkaj.com/teams/sohozkaj-hasib.webp",
  },
  {
    id: 12,
    name: "Sakib Alim",
    role: "Video editing",
    category: "Support",
    image: "https://files.sohozkaj.com/teams/sohozkaj-video-team-1.webp",
  },
  {
    id: 13,
    name: "Mehdi Hassan Echo",
    role: "Customer Support",
    category: "Customer Team",
    image: "https://files.sohozkaj.com/teams/sohozkaj-support-2.webp",
  },
  {
    id: 14,
    name: "Sahajaka Team",
    role: "Group photos",
    category: "Group photos",
    image: "https://files.sohozkaj.com/teams/sohozkaj-team-5.webp",
    wide: true,
  },
  {
    id: 15,
    name: "Abu Imran",
    role: "Content",
    category: "Support",
    image: "https://files.sohozkaj.com/teams/sohozkaj-team-1.webp",
  },
  {
    id: 16,
    name: "Md. Aljami Javad",
    role: "Customer Team",
    category: "Customer Team",
    image: "https://files.sohozkaj.com/teams/sohozkaj-jami.webp",
  },
  {
    id: 17,
    name: "Al Sajjadul",
    role: "Customer Team",
    category: "Customer Team",
    image: "https://files.sohozkaj.com/teams/sohozkaj-suza.webp",
  },
  {
    id: 18,
    name: "Manjur Rahman",
    role: "Marketing",
    category: "Support",
    image: "https://files.sohozkaj.com/teams/sohozkaj-ridoy.webp",
  },
  {
    id: 19,
    name: "Video Team",
    role: "Group photos",
    category: "Group photos",
    image: "https://files.sohozkaj.com/teams/video-team.webp",
    wide: true,
  },
  {
    id: 20,
    name: "Team Moment",
    role: "Group photos",
    category: "Group photos",
    image: "https://files.sohozkaj.com/teams/sohozkaj-shehan.webp",
  },
];

function ArrowIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 16 16 8M10 8h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhotoBadge() {
  return (
    <span className="photo-badge" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 7h8l1.3 2H20a1 1 0 0 1 1 1v9H3v-9a1 1 0 0 1 1-1h2.7L8 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

export default function OurTeamPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const visibleTeam = useMemo(() => {
    if (activeFilter === "All") return team;
    return team.filter((member) => member.category === activeFilter);
  }, [activeFilter]);

  return (
    <>
      <main className="team-page">
        <section className="team-shell">
          <header className="page-header">
            <div className="header-topline">
              <div className="crumbs">
                <span className="crumb-home">
                  <HomeIcon />
                </span>
                <span>Bay City</span>
                <span className="crumb-separator">›</span>
                <strong>Our Team</strong>
              </div>

              <a className="back-link" href="/">
                <ArrowIcon />
                <span>Return to homepage</span>
              </a>
            </div>

            <div className="title-row">
              <div className="title-left">
                <div className="title-icon" aria-hidden="true">
                  <span />
                </div>
                <div>
                  <h1>Our Team</h1>
                  <p>
                    The people behind every pixel — product &amp; passion and
                    team moments.
                  </p>
                </div>
              </div>

              <span className="picture-count">
                <span className="count-dot" /> {team.length} pictures
              </span>
            </div>
          </header>

          <div className="filter-bar">
            <div className="filter-row">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`filter-pill ${activeFilter === filter ? "active" : ""}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span className="result-count">{visibleTeam.length} pictures</span>
          </div>

          <section className="gallery" aria-label="Our team photos">
            {visibleTeam.map((member) => (
              <article
                key={member.id}
                className={`team-card ${member.wide ? "wide" : ""}`}
              >
                <div className="photo-wrap">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading={member.id <= 6 ? "eager" : "lazy"}
                    onError={(event) => {
                      const image = event.currentTarget;
                      image.style.display = "none";
                      image.parentElement?.classList.add("image-missing");
                    }}
                  />
                  <PhotoBadge />
                </div>

                <div className="card-copy">
                  <h2>{member.name}</h2>
                  <p>
                    <span className="role-bullet" />
                    {member.role}
                  </p>
                </div>
              </article>
            ))}
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
            background: #fbfcfe;
            color: #10203b;
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
                rgba(255, 126, 0, 0.035),
                transparent 27%
              ),
              #fbfcfe;
          }

          .team-shell {
            width: min(1120px, 100%);
            margin: 0 auto;
          }

          .page-header {
            padding: 2px 0 20px;
            border-bottom: 1px solid #e8ebf1;
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
            color: #91a0b4;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .crumbs strong {
            color: #23324d;
            font-weight: 800;
          }

          .crumb-home {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #7e8ba0;
          }

          .crumb-separator {
            color: #c5ccd6;
            font-size: 15px;
            transform: translateY(-1px);
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #8996aa;
            text-decoration: none;
            font-size: 11px;
            font-weight: 700;
            transition: color 160ms ease;
          }

          .back-link:hover {
            color: #10203b;
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
            background: linear-gradient(180deg, #fffaf3, #fff3e5);
            border: 1px solid #ffdcb2;
            box-shadow: 0 2px 5px rgba(51, 32, 0, 0.04);
          }

          .title-icon span {
            width: 8px;
            height: 8px;
            border-radius: 3px;
            background: #ff7a00;
            box-shadow: 0 0 0 1px rgba(255, 122, 0, 0.04);
          }

          h1 {
            margin: 0;
            font-size: clamp(22px, 2.2vw, 27px);
            line-height: 1;
            letter-spacing: -0.035em;
            color: #0f1b33;
            font-weight: 850;
          }

          .title-left p {
            margin: 6px 0 0;
            color: #8e9aae;
            font-size: 11px;
            line-height: 1.35;
            font-weight: 600;
          }

          .picture-count {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #d87a16;
            border: 1px solid #ffd7ac;
            background: #fffaf3;
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
            background: #ff7a00;
          }

          .filter-bar {
            padding: 16px 0 14px;
            border-bottom: 1px solid #eef0f4;
          }

          .filter-row {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
          }

          .filter-pill {
            border: 1px solid #dbe0e8;
            background: #fff;
            color: #5f6d83;
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
            border-color: #cbd3df;
            box-shadow: 0 5px 12px rgba(26, 40, 65, 0.05);
          }

          .filter-pill.active {
            color: #fff;
            background: #ff7a00;
            border-color: #ff7a00;
            box-shadow: 0 8px 16px rgba(255, 122, 0, 0.18);
          }

          .result-count {
            color: #99a4b4;
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
            border: 1px solid #e4e7ed;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 5px rgba(20, 30, 50, 0.045);
          }

          .team-card.wide {
            grid-column: span 2;
          }

          .photo-wrap {
            position: relative;
            height: 174px;
            overflow: hidden;
            background: linear-gradient(135deg, #eef1f5, #f7f8fa);
          }

          .photo-wrap img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
            transition: transform 260ms ease;
          }

          .team-card:hover .photo-wrap img {
            transform: scale(1.028);
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
            color: #647287;
            background: rgba(255, 255, 255, 0.86);
            border: 1px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 7px rgba(22, 32, 48, 0.11);
            backdrop-filter: blur(3px);
          }

          .card-copy {
            padding: 9px 10px 10px;
          }

          .card-copy h2 {
            margin: 0;
            color: #152440;
            font-size: 11px;
            line-height: 1.22;
            letter-spacing: -0.015em;
            font-weight: 850;
          }

          .card-copy p {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 5px 0 0;
            color: #99a3b3;
            font-size: 9px;
            line-height: 1.15;
            font-weight: 700;
          }

          .role-bullet {
            width: 5px;
            height: 5px;
            flex: 0 0 5px;
            border-radius: 2px;
            background: #ff7a00;
          }

          .image-missing::before {
            content: "Team photo";
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            color: #a7b0bf;
            font-size: 12px;
            font-weight: 800;
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
    </>
  );
}
