import type { ReactNode } from "react";
import Footer from "@/components/Footer";

type SectionProps = {
  number: string;
  title: string;
  children: ReactNode;
};

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="terms-section">
      <h2>
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function WhatsappIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      className="whatsapp-icon"
    >
      <circle
        cx="12"
        cy="12"
        r="8.65"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8.45 18.55 7.35 21l2.48-1.08a8.7 8.7 0 1 0-1.38-1.37Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 9.18c.16-.35.32-.36.6-.36h.45c.2 0 .34.11.43.33l.62 1.45c.08.2.04.38-.08.54l-.4.5c-.11.14-.12.26-.04.41.34.6 1.2 1.53 2.36 1.98.2.07.3.04.42-.08l.55-.66c.13-.16.3-.2.5-.1l1.38.65c.2.09.27.22.24.44-.06.4-.34 1.04-.92 1.34-.48.25-1.24.22-2.1-.13-.73-.3-1.61-.88-2.53-1.75-.78-.72-1.57-1.76-1.92-2.48-.31-.64-.38-1.19-.17-1.63Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <main className="terms-page">
      <style>{`
        .terms-page {
          min-height: 100vh;
          background: rgb(243, 242, 245);
          color: #252a31;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        .terms-page *,
        .terms-page *::before,
        .terms-page *::after {
          box-sizing: border-box;
        }

        .terms-document-wrap {
          width: 100%;
          padding: 80px 24px 43px;
        }

        .terms-document {
          width: min(100%, 894px);
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 15px;
          box-shadow:
            0 1px 2px rgba(17, 24, 39, 0.025),
            0 3px 10px rgba(17, 24, 39, 0.018);
          padding: 53px 52px 50px;
        }

        .terms-document h1 {
          margin: 0;
          padding: 0 0 15px;
          border-bottom: 1px solid #17191d;
          color: #101723;
          font-size: 27px;
          line-height: 1.18;
          font-weight: 700;
          letter-spacing: -0.65px;
        }

        .terms-intro {
          margin: 27px 0 35px;
          color: #28303a;
          font-size: 16px;
          line-height: 1.55;
          letter-spacing: -0.08px;
        }

        .terms-section {
          margin: 0 0 31px;
        }

        .terms-section h2 {
          margin: 0 0 14px;
          color: #101723;
          font-size: 17px;
          line-height: 1.28;
          font-weight: 700;
          letter-spacing: -0.26px;
        }

        .terms-section p {
          margin: 0 0 11px;
          color: #333b46;
          font-size: 14px;
          line-height: 1.48;
          letter-spacing: -0.04px;
        }

        .terms-section ul {
          margin: 0;
          padding-left: 27px;
          color: #333b46;
          font-size: 14px;
          line-height: 1.46;
        }

        .terms-section li {
          margin: 0 0 5px;
          padding-left: 1px;
        }

        .terms-section li::marker {
          font-size: 0.78em;
        }

        .terms-section a {
          color: #2e78cf;
          text-decoration: none;
        }

        .terms-section a:hover {
          text-decoration: underline;
        }

        .license-box,
        .retention-box {
          margin-top: 15px;
          padding: 22px 22px 21px;
          background: #faf9fc;
          border: 1px solid #efeff2;
          border-radius: 6px;
        }

        .license-box + .license-box {
          margin-top: 15px;
        }

        .license-box h3,
        .retention-box h3 {
          margin: 0 0 10px;
          color: #111722;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.16px;
        }

        .license-box ul {
          margin: 0;
        }

        .retention-box {
          margin-bottom: 16px;
        }

        .retention-block + .retention-block {
          margin-top: 20px;
        }

        .retention-title {
          margin: 0 0 6px;
          color: #101722;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 700;
        }

        .retention-text {
          margin: 0;
          color: #333b46;
          font-size: 14px;
          line-height: 1.48;
        }

        .communication strong {
          color: #0f1720;
        }

        .terms-divider {
          margin-top: 31px;
          border-top: 1px solid #e1e1e4;
        }

        .terms-closing {
          margin-top: 29px;
          text-align: center;
          color: #333b46;
          font-size: 14px;
          line-height: 1.45;
        }

        .terms-closing p {
          margin: 0;
        }

        .terms-closing p + p {
          margin-top: 2px;
        }

        .whatsapp {
          position: fixed;
          right: 21px;
          bottom: 19px;
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #24d36c;
          color: #fff;
          box-shadow: 0 9px 23px rgba(36, 211, 108, 0.26);
          z-index: 20;
        }

        .whatsapp-icon {
          width: 30px;
          height: 30px;
        }

        @media (max-width: 940px) {
          .terms-document {
            width: 100%;
          }
        }

        @media (max-width: 820px) {
          .terms-document-wrap {
            padding: 34px 16px 32px;
          }

          .terms-document {
            padding: 36px 28px 40px;
          }

          .terms-document h1 {
            font-size: 25px;
          }

          .terms-intro,
          .terms-section p,
          .terms-section ul,
          .retention-text,
          .terms-closing {
            font-size: 14px;
          }

          .terms-section h2 {
            font-size: 16px;
          }
        }

        @media (max-width: 520px) {
          .terms-document-wrap {
            padding: 16px 10px 20px;
          }

          .terms-document {
            padding: 25px 18px 30px;
            border-radius: 11px;
          }

          .terms-document h1 {
            font-size: 23px;
            padding-bottom: 14px;
          }

          .terms-intro {
            margin-top: 22px;
          }

          .terms-section {
            margin-bottom: 27px;
          }

          .terms-section ul {
            padding-left: 22px;
          }

          .license-box,
          .retention-box {
            padding: 18px 16px;
          }

          .whatsapp {
            right: 16px;
            bottom: 15px;
            width: 51px;
            height: 51px;
          }

          .whatsapp-icon {
            width: 27px;
            height: 27px;
          }
        }
      `}</style>

      <div className="terms-document-wrap">
        <article className="terms-document">
          <h1>Terms &amp; Conditions</h1>

          <p className="terms-intro">
            Welcome to Sohoz Kaj (
            <a href="https://sohozkaj.com" target="_blank" rel="noreferrer">
              sohozkaj.com
            </a>
            ). By using this website, you agree to the terms and conditions
            below. Please read the terms and conditions carefully.
          </p>

          <Section number="1" title="Definition">
            <BulletList
              items={[
                <>
                  &quot;Website/we/our&quot; refers to Easy Work (
                  <a
                    href="https://sohozkaj.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    sohozkaj.com
                  </a>
                  ).
                </>,
                <>
                  &quot;User/You&quot; means the website user or credit
                  purchaser.
                </>,
                <>
                  &quot;Digital Template&quot; means any downloadable file on
                  the Website.
                </>,
                <>
                  &quot;Services&quot; means all modules of Sahoj Kaaj - AI
                  image generation, bulk photo editing, image editor, AI
                  templates and documents, print media, Sahoj Tools, form
                  autofill, office space, income and expenses, and job board,
                  etc.
                </>,
                <>
                  &quot;Credit&quot; means prepaid balance purchased for use of
                  the service, which is spent on each AI task.
                </>,
              ]}
            />
          </Section>

          <Section number="2" title="Terms of use of the website">
            <BulletList
              items={[
                "You can log in to your account and use it on a maximum of 10 (ten) devices.",
                "Most of the features of Easy Tasks are free to use; only some modules cost credits, which are spent on each AI task.",
                "This website must be used for personal, business and lawful purposes.",
                "Any activity that is illegal, violates copyright, or damages the server is strictly prohibited.",
                "The content of the website may not be copied, uploaded, sold or distributed in an unauthorized and unalterable manner.",
              ]}
            />
          </Section>

          <Section number="3" title="Nature of digital products">
            <BulletList
              items={[
                "There is no subscription system in Sahaj Kaaj. You buy credits and spend them only on paid modules; all other features are free.",
                "These templates are downloadable and there is no physical delivery.",
              ]}
            />
          </Section>

          <Section number="4" title="License (Personal and Commercial License)">
            <p>
              Easy Work provides two types of templates—free and premium. Once
              you download the template, you can use it according to the license
              below:
            </p>

            <div className="license-box">
              <h3>4.1 Personal License:</h3>
              <BulletList
                items={[
                  "Personal use",
                  "Non-commercial use for office, school or personal purposes",
                  "Templates cannot be shared or re-uploaded elsewhere.",
                ]}
              />
            </div>

            <div className="license-box">
              <h3>4.2 Commercial License:</h3>
              <BulletList
                items={[
                  "Business, company or commercial use",
                  "Can be used in client projects",
                  'Resale, redistribution, or sharing of templates "as-is" is not permitted.',
                ]}
              />
            </div>
          </Section>

          <Section number="5" title="Payment and pricing">
            <BulletList
              items={[
                "Prices are displayed in Bangladeshi Taka (BDT) for users in Bangladesh and in US Dollars (USD) for international users; there are separate payment gateways for each.",
                "Simple Tasks runs on a pay-as-you-go credit model—you buy a credit package and each AI task costs credits.",
                "Payments are made through payment gateway redirects; your card information is not stored in the app.",
                "Only if the payment is successful will the credit be added or the download link be activated.",
                "We provide advance credit facility at our discretion to those who have paid in advance. The advance credit used is deducted from your next recharge. Only users who have paid in advance can avail this facility.",
                "We may change prices at any time.",
                "We may discontinue, change, or update any offer at any time—even before the specified offer period ends.",
              ]}
            />
          </Section>

          <Section number="6" title="Refund Policy">
            <p>
              As it is a digital product/service, no refunds are generally
              provided, except in the following cases:
            </p>

            <BulletList
              items={[
                "File not downloading",
                "If the file is damaged or unusable",
              ]}
            />

            <p style={{ marginTop: "10px" }}>
              If you would like a refund, kindly email{" "}
              <a href="mailto:hello@sohozkaj.com">hello@sohozkaj.com</a>
            </p>
          </Section>

          <Section number="7" title="Copyright and ownership">
            <BulletList
              items={[
                "All digital templates, designs, writing, and graphics on the website are protected by copyright law.",
                "The user does not own the template; they only receive a license to use it.",
                "Legal action will be taken if content is stolen, copied, re-uploaded, or sold.",
              ]}
            />
          </Section>

          <Section number="8" title="Prohibited activities">
            <p>The user cannot perform the following actions:</p>
            <BulletList
              items={[
                "Reselling or gifting templates",
                "Uploading to file sharing sites",
                'Redistribution in "as is" format',
                "Attempting to hack a website or damage a server",
                "Indecent or harmful comments/external spamming, etc.",
              ]}
            />
          </Section>

          <Section number="9" title="Account and security">
            <BulletList
              items={[
                "The user is solely responsible for the security of their account information.",
                "The website has the ability to block accounts if suspicious activity is detected on the account.",
              ]}
            />
          </Section>

          <Section number="10" title="Data retention policy">
            <p>
              When you create an image, document, or file using Easy Work Tools,
              our following policies apply to those files:
            </p>

            <div className="retention-box">
              <div className="retention-block">
                <h3 className="retention-title">Personal access</h3>
                <p className="retention-text">
                  The files, images, or documents you create are completely
                  private to you. No other user will be able to view or access
                  your files. Only you can view and download them by logging
                  into your account.
                </p>
              </div>

              <div className="retention-block">
                <h3 className="retention-title">Storage period</h3>
                <p className="retention-text">
                  <strong>
                    We will store your files for free for 1 (one) year
                  </strong>{" "}
                  from the date of file creation. After this period, the file
                  will be automatically deleted.
                </p>
              </div>

              <div className="retention-block">
                <h3 className="retention-title">Lifetime preservation</h3>
                <p className="retention-text">
                  If you want, you can pay a small annual fee to keep your files
                  forever. With this feature turned on, your files will never be
                  deleted.
                </p>
              </div>
            </div>

            <BulletList
              items={[
                "We do not share user files with third parties.",
                "We will notify you by email before the file is deleted.",
                "You can delete your files yourself at any time.",
              ]}
            />
          </Section>

          <Section number="11" title="Service changes">
            <p>Easy work anytime:</p>
            <BulletList
              items={[
                "Products, prices, layouts, or features may change.",
                "The site may be temporarily closed if necessary.",
              ]}
            />
          </Section>

          <Section number="12" title="Limitation of Liability">
            <BulletList
              items={[
                "Easy Work is not responsible for any errors, damages, or consequences resulting from using the template.",
                "The user will use the product/service at his own discretion and risk.",
                "Our AI features try their best, but the results are not guaranteed to be 100% accurate. Sometimes the AI may slightly change the appearance or the results may not match your input exactly. This is a natural limitation of AI technology, not our fault. By using these features, you understand and accept that such differences may occur.",
              ]}
            />
          </Section>

          <Section number="13" title="Third-party links">
            <p>
              We are not responsible for the content or security of external
              links on the site.
            </p>
          </Section>

          <Section number="14" title="Legal jurisdiction">
            <p>
              These terms and conditions shall be governed by the prevailing
              laws of Bangladesh.
            </p>
          </Section>

          <Section number="15" title="Communication">
            <div className="communication">
              <p>
                For any questions or complaints regarding the Terms and
                Conditions, please contact:
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:hello@sohozkaj.com">hello@sohozkaj.com</a>
                <br />
                <strong>Phone:</strong>{" "}
                <a href="tel:+8801700559595">+88 01700-559595</a>
                <br />
                <strong>Website:</strong>{" "}
                <a
                  href="https://www.sohozkaj.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.sohozkaj.com
                </a>
              </p>
            </div>
          </Section>

          <div className="terms-divider" />

          <div className="terms-closing">
            <p>Easy work - Bangla template easily</p>
            <p>
              By using the website, you will be deemed to have agreed to these
              Terms &amp; Conditions.
            </p>
          </div>
        </article>
      </div>

      <Footer />

      <a
        className="whatsapp"
        href="https://wa.me/8801700559595"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
      >
        <WhatsappIcon />
      </a>
    </main>
  );
}
