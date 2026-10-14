"use client";

import { useState } from "react";
import { T } from "@/components/i18n/I18nProvider";
import Footer from "@/components/Footer";

const FOUNDER_IMAGE_URL =
  "https://scontent.fdac165-1.fna.fbcdn.net/v/t39.30808-6/830162073_122117058801455546_9222997689185944451_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1536&ctp=s1024x1536&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFXk2DRYIMaT2rWUpeNS_QDO3oAE2SwZaw7egATZLBlrFuLbZxjfp2t1mEf0QSZ0qIfZc4Yht_g_s0X90DPJ-dn&_nc_ohc=7x8U3zFbJlgQ7kNvwG6ns6H&_nc_oc=AdrRhGzk9peqPK8DDRPa7fIiogRY07OV8My9-5h2RtQ-f2-_zmcWUpuDgjB4GtgwOxQ&_nc_zt=23&_nc_ht=scontent.fdac165-1.fna&_nc_gid=Ma3aijScui9BVI5wKi8slg&_nc_ss=7b2a8&oh=00_AQPvQJenAoDJpFaA4PQUyawFs7XV4baUGHBtVFlzMZtpjA&oe=6AD5352F";

type Opportunity = {
  title: string;
  description: string;
  type: string;
};

const opportunities: Opportunity[] = [
  {
    title: "Frontend / UI Developer",
    description:
      "Help refine page layouts, responsive behaviour, accessibility, and the overall user experience.",
    type: "Product & development",
  },
  {
    title: "Backend / Full-Stack Collaborator",
    description:
      "Work together on APIs, integrations, reliability, and practical features that users need.",
    type: "Product & development",
  },
  {
    title: "UI/UX & Visual Designer",
    description:
      "Bring fresh ideas to the interface, design system, illustrations, and visual consistency.",
    type: "Design",
  },
  {
    title: "Content & Tutorial Creator",
    description:
      "Make helpful guides, short tutorials, and clear content that helps people use the tools.",
    type: "Content",
  },
  {
    title: "Marketing & Community",
    description:
      "Help more people discover Sohoj Hub, listen to feedback, and grow a useful community.",
    type: "Growth",
  },
  {
    title: "Business & Growth Partner",
    description:
      "Share product ideas, partnerships, and sustainable ways to take the platform forward.",
    type: "Partnership",
  },
];

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="m12 2 2.2 6.3L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoleIcon({ index }: { index: number }) {
  const paths = [
    <path key="p1" d="M4 5h16v14H4zM8 9h8M8 13h5" />,
    <path key="p2" d="M7 4h10v16H7zM10 8h4M10 12h4M10 16h2" />,
    <path key="p3" d="m12 3 2.4 5.2L20 9l-4 4 .9 5.7-4.9-2.8-4.9 2.8.9-5.7-4-4 5.6-.8L12 3Z" />,
    <path key="p4" d="M4 5h16v12H9l-5 3V5ZM8 9h8M8 13h5" />,
    <path key="p5" d="M4 18V6m0 12h16M7 15l4-4 3 2 5-6" />,
    <path key="p6" d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" />,
  ];
  return (
    <span className="opportunity-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {paths[index % paths.length]}
      </svg>
    </span>
  );
}

export default function OurTeamPage() {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <>
      <main className="team-page">
        <div className="team-shell">
          <div className="team-breadcrumbs">
            <a href="/"><T>Home</T></a>
            <span aria-hidden="true">/</span>
            <span className="breadcrumb-current"><T>Our Team</T></span>
          </div>

          <section className="team-intro">
            <div className="eyebrow"><SparkIcon /><T>Building Sohoj Hub together</T></div>
            <h1><T>One founder. A growing vision.</T></h1>
            <p className="intro-copy">
              <T>Sohoj Hub is being built step by step, with a clear goal: make useful digital work simpler and more accessible.</T>
            </p>
          </section>

          <section className="founder-card" aria-labelledby="founder-heading">
            <div className="founder-photo-frame">
              {!photoFailed ? (
                <img
                  className="founder-photo"
                  src={FOUNDER_IMAGE_URL}
                  alt="Sohoj Hub founder"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="founder-photo-fallback" aria-label="Sohoj Hub founder">SH</div>
              )}
              <span className="founder-online-dot" aria-hidden="true" />
            </div>

            <div className="founder-label"><T>Founder profile</T></div>
            <h2 id="founder-heading"><T>Founder & Website Administrator</T></h2>
            <p className="founder-subtitle"><T>Solo Full-Stack Developer</T></p>
            <p className="founder-bio">
              <T>I started building Sohoj Hub independently around two months ago. I handle the work hands-on, keep learning as I go, and want to grow the platform with people who care about useful products and thoughtful teamwork.</T>
            </p>
            <div className="founder-tags">
              <span><T>Built independently</T></span>
              <span><T>Early-stage project</T></span>
              <span><T>Open to collaboration</T></span>
            </div>
            <a className="button button-primary founder-cta" href="/contact">
              <T>Connect with me</T><ArrowIcon />
            </a>
          </section>

          <section className="opportunities-section" aria-labelledby="opportunities-heading">
            <div className="section-heading">
              <div className="eyebrow"><SparkIcon /><T>Open collaboration opportunities</T></div>
              <h2 id="opportunities-heading"><T>Help shape what Sohoj Hub becomes.</T></h2>
              <p>
                <T>I’m currently building the platform on my own. If you have skills, ideas, or energy to help it grow, there may be a place for you here.</T>
              </p>
            </div>

            <div className="opportunity-grid">
              {opportunities.map((opportunity, index) => (
                <article className="opportunity-card" key={opportunity.title}>
                  <div className="opportunity-card-top">
                    <RoleIcon index={index} />
                    <span className="opportunity-type"><T>{opportunity.type}</T></span>
                  </div>
                  <h3><T>{opportunity.title}</T></h3>
                  <p><T>{opportunity.description}</T></p>
                  <a href="/contact" className="opportunity-link">
                    <T>Discuss this opportunity</T><ArrowIcon />
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="join-cta">
            <div className="join-cta-icon"><SparkIcon /></div>
            <div className="join-cta-copy">
              <span className="join-kicker"><T>Let’s build something meaningful</T></span>
              <h2><T>Want to grow with an early-stage product?</T></h2>
              <p>
                <T>Tell me what you’re good at, what you’d like to contribute, and how you imagine working together. We can discuss responsibilities and a fair arrangement openly—there’s no need to fit a fixed role.</T>
              </p>
            </div>
            <a className="button button-light" href="/contact">
              <T>Let’s talk</T><ArrowIcon />
            </a>
          </section>

          <p className="team-note">
            <T>These are invitations to collaborate, not promises of a specific job or compensation. Details can be discussed directly.</T>
          </p>
        </div>
      </main>
      <style jsx global>{`
        .team-page {
          width: 100%;
          padding: 30px 20px 68px;
          color: #172033;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.09), transparent 42%),
            linear-gradient(180deg, #fffbed 0%, #fffdf6 45%, #fff9e8 100%);
        }
        .team-shell { width: min(1120px, 100%); margin: 0 auto; }
        .team-breadcrumbs { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; font-size: 12px; color: #7b8191; }
        .team-breadcrumbs a { color: #5c63c9; text-decoration: none; font-weight: 650; }
        .team-breadcrumbs a:hover { text-decoration: underline; }
        .breadcrumb-current { color: #262d43; font-weight: 750; }
        .team-intro { max-width: 780px; margin: 0 auto 30px; text-align: center; }
        .eyebrow { display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: #554fe0; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .team-intro h1 { margin: 14px 0 12px; color: #15192b; font-size: clamp(32px, 4vw, 48px); line-height: 1.08; letter-spacing: -.045em; font-weight: 850; }
        .intro-copy { max-width: 650px; margin: 0 auto; color: #697086; font-size: 15px; line-height: 1.8; }
        .founder-card { position: relative; width: min(760px, 100%); margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 34px clamp(20px, 5vw, 56px) 36px; overflow: hidden; border: 1px solid rgba(137, 130, 190, .23); border-radius: 28px; background: rgba(255,255,255,.84); box-shadow: 0 24px 70px rgba(47, 42, 106, .10), 0 3px 12px rgba(45, 48, 84, .04); }
        .founder-card::before { position: absolute; content: ''; width: 280px; height: 280px; top: -175px; left: calc(50% - 140px); border-radius: 50%; background: rgba(99, 102, 241, .15); filter: blur(22px); pointer-events: none; }
        .founder-photo-frame { position: relative; z-index: 1; width: 168px; height: 206px; padding: 5px; border: 1px solid rgba(99, 102, 241, .25); border-radius: 24px; background: linear-gradient(140deg, #4f46e5, #a855f7 55%, #fde68a); box-shadow: 0 12px 30px rgba(76, 61, 190, .18); }
        .founder-photo { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 33%; border-radius: 19px; background: #eeecff; }
        .founder-photo-fallback { width: 100%; height: 100%; display: grid; place-items: center; border-radius: 19px; color: #fff; font-size: 38px; font-weight: 850; letter-spacing: -.06em; background: linear-gradient(135deg, #4338ca, #9333ea); }
        .founder-online-dot { position: absolute; right: -5px; bottom: 13px; width: 18px; height: 18px; border: 4px solid #fff; border-radius: 50%; background: #22c55e; }
        .founder-label { margin-top: 21px; padding: 7px 12px; border: 1px solid #e4e0ff; border-radius: 999px; color: #625bdc; background: #f6f4ff; font-size: 10px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
        .founder-card h2 { margin: 13px 0 0; color: #191d31; font-size: clamp(22px, 2.5vw, 29px); line-height: 1.2; font-weight: 850; letter-spacing: -.03em; }
        .founder-subtitle { margin: 8px 0 0; color: #5e5bd2; font-size: 13px; font-weight: 800; }
        .founder-bio { max-width: 600px; margin: 16px 0 0; color: #687086; font-size: 14px; line-height: 1.85; }
        .founder-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 20px; }
        .founder-tags span { padding: 8px 11px; border: 1px solid #ebe8f7; border-radius: 999px; color: #525a70; background: #fbfaff; font-size: 11px; font-weight: 700; }
        .button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 0 18px; border-radius: 13px; text-decoration: none; font-size: 12px; font-weight: 800; transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
        .button:hover { transform: translateY(-2px); }
        .button-primary { color: #fff; background: linear-gradient(100deg, #4058e8, #8a2be2); box-shadow: 0 10px 22px rgba(85, 66, 218, .22); }
        .button-primary:hover { box-shadow: 0 14px 28px rgba(85, 66, 218, .29); }
        .founder-cta { margin-top: 23px; }
        .opportunities-section { padding-top: 76px; }
        .section-heading { max-width: 760px; margin: 0 auto 28px; text-align: center; }
        .section-heading h2 { margin: 12px 0 10px; color: #181c2f; font-size: clamp(27px, 3.5vw, 38px); font-weight: 850; letter-spacing: -.04em; line-height: 1.16; }
        .section-heading p { max-width: 680px; margin: 0 auto; color: #71768a; font-size: 14px; line-height: 1.8; }
        .opportunity-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .opportunity-card { display: flex; flex-direction: column; min-height: 244px; padding: 22px; border: 1px solid rgba(139, 133, 183, .19); border-radius: 20px; background: rgba(255,255,255,.82); box-shadow: 0 8px 22px rgba(35, 36, 69, .045); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .opportunity-card:hover { transform: translateY(-4px); border-color: rgba(99, 102, 241, .35); box-shadow: 0 16px 32px rgba(47, 42, 106, .09); }
        .opportunity-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .opportunity-icon { width: 43px; height: 43px; display: grid; place-items: center; flex: 0 0 43px; border: 1px solid #e5e2ff; border-radius: 14px; color: #5b52df; background: linear-gradient(140deg, #f3f1ff, #fff8e9); }
        .opportunity-type { padding: 6px 8px; border-radius: 999px; color: #706baf; background: #f6f4ff; font-size: 9px; font-weight: 800; }
        .opportunity-card h3 { margin: 17px 0 8px; color: #20243a; font-size: 16px; line-height: 1.35; font-weight: 850; letter-spacing: -.02em; }
        .opportunity-card p { margin: 0 0 18px; color: #73788a; font-size: 12px; line-height: 1.75; }
        .opportunity-link { display: inline-flex; align-items: center; gap: 8px; margin-top: auto; color: #5149d7; text-decoration: none; font-size: 11px; font-weight: 850; }
        .opportunity-link:hover { color: #7e22ce; }
        .join-cta { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 22px; margin-top: 58px; padding: 30px; border: 1px solid rgba(167, 157, 255, .25); border-radius: 24px; color: #fff; background: radial-gradient(circle at 14% 0%, rgba(147, 112, 255, .28), transparent 34%), linear-gradient(115deg, #11172e, #19163e 58%, #281952); box-shadow: 0 22px 46px rgba(23, 21, 59, .15); }
        .join-cta-icon { width: 54px; height: 54px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.18); border-radius: 17px; color: #d7d3ff; background: rgba(255,255,255,.08); }
        .join-cta-copy { min-width: 0; }
        .join-kicker { color: #b9b4ff; font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
        .join-cta h2 { margin: 7px 0 8px; color: #fff; font-size: clamp(20px, 2.3vw, 27px); line-height: 1.2; font-weight: 850; letter-spacing: -.035em; }
        .join-cta p { max-width: 680px; margin: 0; color: #d1d4e4; font-size: 12px; line-height: 1.8; }
        .button-light { color: #30275f; background: #fff8df; box-shadow: 0 8px 18px rgba(0,0,0,.12); white-space: nowrap; }
        .button-light:hover { background: #fff; }
        .team-note { max-width: 780px; margin: 17px auto 0; color: #85899a; text-align: center; font-size: 10px; line-height: 1.7; }
        @media (max-width: 900px) {
          .opportunity-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .join-cta { grid-template-columns: auto minmax(0, 1fr); }
          .join-cta .button { grid-column: 2; justify-self: start; }
        }
        @media (max-width: 600px) {
          .team-page { padding: 20px 13px 44px; }
          .team-breadcrumbs { margin-bottom: 18px; }
          .team-intro { margin-bottom: 23px; }
          .team-intro h1 { font-size: 32px; }
          .intro-copy { font-size: 13px; }
          .founder-card { padding: 26px 18px 28px; border-radius: 22px; }
          .founder-photo-frame { width: 150px; height: 186px; }
          .founder-bio { font-size: 13px; }
          .opportunities-section { padding-top: 54px; }
          .section-heading h2 { font-size: 28px; }
          .section-heading p { font-size: 13px; }
          .opportunity-grid { grid-template-columns: minmax(0, 1fr); gap: 11px; }
          .opportunity-card { min-height: 0; padding: 19px; }
          .join-cta { grid-template-columns: minmax(0, 1fr); gap: 13px; margin-top: 40px; padding: 23px 20px; border-radius: 21px; }
          .join-cta .button { grid-column: 1; justify-self: stretch; }
          .join-cta-icon { width: 46px; height: 46px; }
        }
      `}</style>
      <Footer />
    </>
  );
}
