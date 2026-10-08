"use client";
import { T } from "@/components/i18n/I18nProvider";
import Footer from "@/components/Footer";
function WhatsAppIcon() {
    return (<svg viewBox="0 0 24 24" aria-hidden="true" className="whatsapp-icon">
      <circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8.4 18.6 7.4 21l2.4-1.1A8.7 8.7 0 1 0 8.4 18.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9.1 9.2c.15-.34.32-.35.6-.35h.45c.2 0 .34.1.42.32l.62 1.45c.08.2.04.38-.08.54l-.4.5c-.11.13-.12.25-.04.4.33.6 1.2 1.54 2.36 1.98.19.08.3.05.41-.07l.55-.67c.13-.16.3-.2.49-.1l1.39.65c.2.1.27.23.24.45-.05.39-.33 1.04-.91 1.34-.48.25-1.24.22-2.1-.13-.73-.3-1.61-.88-2.54-1.75-.77-.73-1.56-1.77-1.91-2.48-.32-.64-.38-1.2-.18-1.64Z" fill="currentColor"/>
    </svg>);
}
export default function PrivacyPolicyPage() {
    return (<main className="privacy-page">
      <style>{`
        .privacy-page {
          min-height: 100vh;
          background: #F8FAFC;
          color: #0F172A;
          font-family: Arial, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .privacy-page *,
        .privacy-page *::before,
        .privacy-page *::after {
          box-sizing: border-box;
        }

        .privacy-page a {
          color: inherit;
        }

        .privacy-shell {
          width: 100%;
          padding: 80px 24px 60px;
        }

        .privacy-paper {
          width: min(100%, 958px);
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, .018),
            0 4px 12px rgba(15, 23, 42, .025);
          padding: 61px 54px 39px;
        }

        .privacy-title {
          margin: 0;
          padding-bottom: 16px;
          border-bottom: 1px solid #E2E8F0;
          color: #0F172A;
          font-size: 29px;
          line-height: 1.16;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .privacy-intro {
          margin: 31px 0 37px;
          color: #0F172A;
          font-size: 16px;
          line-height: 1.48;
          letter-spacing: -0.1px;
        }

        .privacy-section {
          margin: 0 0 31px;
        }

        .privacy-section h2 {
          margin: 0 0 15px;
          color: #0F172A;
          font-size: 18px;
          line-height: 1.22;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .privacy-section h3 {
          margin: 0 0 10px;
          color: #0F172A;
          font-size: 16px;
          line-height: 1.24;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .privacy-section p {
          margin: 0 0 11px;
          color: #0F172A;
          font-size: 14px;
          line-height: 1.47;
          letter-spacing: -0.04px;
        }

        .privacy-list {
          margin: 0;
          padding-left: 27px;
          color: #0F172A;
          font-size: 14px;
          line-height: 1.45;
        }

        .privacy-list li {
          margin: 0 0 3px;
          padding-left: 1px;
        }

        .privacy-list li::marker {
          font-size: .78em;
        }

        .privacy-section a {
          color: #2563EB;
          text-decoration: none;
        }

        .privacy-section a:hover {
          text-decoration: underline;
        }

        .privacy-subsection {
          margin-top: 21px;
        }

        .privacy-subsection h3 {
          margin-bottom: 10px;
        }

        .privacy-divider {
          margin-top: 30px;
          border-top: 1px solid #E2E8F0;
        }

        .privacy-closing {
          margin-top: 23px;
          text-align: center;
          color: #0F172A;
          font-size: 14px;
          line-height: 1.42;
        }

        .privacy-closing p {
          margin: 0;
        }

        .whatsapp {
          position: fixed;
          right: 21px;
          bottom: 18px;
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #10B981;
          color: #fff;
          text-decoration: none;
          box-shadow: 0 11px 24px rgba(16, 185, 129, .25);
          z-index: 45;
        }

        .whatsapp-icon {
          width: 30px;
          height: 30px;
        }

        @media (max-width: 860px) {
          .privacy-shell {
            padding: 40px 16px 30px;
          }

          .privacy-paper {
            padding: 42px 29px 34px;
          }
        }

        @media (max-width: 520px) {
          .header-inner {
            gap: 10px;
          }

          .brand {
            min-width: 0;
          }

          .brand-bangla {
            font-size: 19px;
          }

          .brand-url {
            font-size: 5px;
            letter-spacing: 1.5px;
          }

          .logo-mark {
            width: 32px;
            height: 32px;
          }

          .language-switch {
            height: 32px;
          }

          .lang-active,
          .lang-inactive {
            height: 24px;
            min-width: 33px;
            font-size: 10px;
          }

          .login-btn {
            min-width: 88px;
            height: 37px;
            padding: 0 12px;
          }

          .privacy-paper {
            padding: 28px 18px 28px;
            border-radius: 11px;
          }

          .privacy-title {
            font-size: 24px;
          }

          .privacy-intro {
            font-size: 14px;
            margin-top: 24px;
            margin-bottom: 30px;
          }

          .privacy-section h2 {
            font-size: 16px;
          }

          .privacy-section h3 {
            font-size: 15px;
          }

          .privacy-section p,
          .privacy-list,
          .privacy-closing {
            font-size: 13px;
          }

          .whatsapp {
            right: 15px;
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

      <div className="privacy-shell">
        <article className="privacy-paper">
          <h1 className="privacy-title"><T>{"Privacy Policy"}</T></h1>

          <div className="privacy-intro">
            <p><T>{"Easy Work (&quot;we&quot;, &quot;us&quot;, &quot;website&quot;) is\r\n              committed to ensuring the privacy of your personal information.\r\n              This Privacy Policy explains how we collect, use and protect your\r\n              information.\r\n            "}</T></p>
            <p><T>{"By using our website, you agree to this policy."}</T></p>
          </div>

          <section className="privacy-section">
            <h2><T>{"1. What information do we collect?"}</T></h2>

            <div className="privacy-subsection">
              <h3><T>{"1.1 Information you provide directly"}</T></h3>
              <ul className="privacy-list">
                <li><T>{"Name"}</T></li>
                <li><T>{"Email address"}</T></li>
                <li><T>{"Phone number (if applicable)"}</T></li>
                <li><T>{"Account registration information"}</T></li>
                <li><T>{"Payment information (but we never store card numbers or CVVs)\r\n                "}</T></li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3><T>{"1.2 Automatically collected information"}</T></h3>
              <ul className="privacy-list">
                <li><T>{"Browser type"}</T></li>
                <li><T>{"Device information"}</T></li>
                <li><T>{"IP address"}</T></li>
                <li><T>{"Website usage analytics"}</T></li>
                <li><T>{"Page views, number of downloads, click patterns, etc."}</T></li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3><T>{"1.3 Cookies"}</T></h3>
              <p><T>{"We use cookies to improve user experience. They are governed by\r\n                our Cookie Policy.\r\n              "}</T></p>
            </div>
          </section>

          <section className="privacy-section">
            <h2><T>{"2. How do we use this information?"}</T></h2>
            <p><T>{"Your information is used:"}</T></p>
            <ul className="privacy-list">
              <li><T>{"To create and manage your account"}</T></li>
              <li><T>{"For purchasing credit packages and providing AI services\r\n                (images, documents, prints, templates and tools)\r\n              "}</T></li>
              <li><T>{"To send order confirmation or receipt by email"}</T></li>
              <li><T>{"To notify about new templates, updates or offers"}</T></li>
              <li><T>{"For website development and analysis"}</T></li>
              <li><T>{"To prevent fraud and ensure security"}</T></li>
              <li><T>{"To provide support as requested."}</T></li>
            </ul>
            <p style={{ marginTop: 12 }}><T>{"We never unnecessarily collect or misuse your personal\r\n              information.\r\n            "}</T></p>
          </section>

          <section className="privacy-section">
            <h2><T>{"3. Is your information shared with anyone else?"}</T></h2>
            <p><T>{"Easy Work does not sell or rent your personal information.\r\n              However, information may be shared in the following circumstances:\r\n            "}</T></p>

            <div className="privacy-subsection">
              <h3><T>{"3.1 Trusted third parties (Third-party services)"}</T></h3>
              <ul className="privacy-list">
                <li><T>{"Payment gateway (e.g. SSLCommerz, Stripe)"}</T></li>
                <li><T>{"Analytics tools (e.g. Google Analytics)"}</T></li>
                <li><T>{"Email service (e.g. MailerLite / SendGrid)"}</T></li>
              </ul>
              <p style={{ marginTop: 7 }}><T>{"They only see the information necessary to provide the service.\r\n              "}</T></p>
            </div>

            <div className="privacy-subsection">
              <h3><T>{"3.2 As required by law"}</T></h3>
              <p><T>{"Information may need to be provided upon legal request from\r\n                government agencies or courts.\r\n              "}</T></p>
            </div>
          </section>

          <section className="privacy-section">
            <h2><T>{"4. How do we protect your information?"}</T></h2>
            <p><T>{"We take the following measures to protect information:"}</T></p>
            <ul className="privacy-list">
              <li><T>{"SSL encryption"}</T></li>
              <li><T>{"Secure server"}</T></li>
              <li><T>{"Regular security updates"}</T></li>
              <li><T>{"Limited access control"}</T></li>
              <li><T>{"Firewall preventing unauthorized access"}</T></li>
            </ul>

            <p style={{ marginTop: 19 }}><T>{"Additionally, as much of the work as possible, such as background\r\n              removal, image compression, HEIC conversion, and PDF/Excel\r\n              creation, is done in your browser\u2014so files aren&apos;t always sent\r\n              to the server. We take the necessary security measures to keep\r\n              user input and content safe, and use secure one-time connections\r\n              to fetch images from mobile. Access to each account is limited\r\n              based on user role.\r\n            "}</T></p>

            <p><T>{"However, it is not possible to ensure 100% security of the\r\n              Internet, and this risk is accepted by any Internet user.\r\n            "}</T></p>
          </section>

          <section className="privacy-section">
            <h2><T>{"5. Children&apos;s privacy"}</T></h2>
            <p><T>{"Easy Work does not collect information from anyone under the age\r\n              of 18. If any information is collected in error, we will promptly\r\n              delete it.\r\n            "}</T></p>
          </section>

          <section className="privacy-section">
            <h2><T>{"6. User rights"}</T></h2>
            <p><T>{"You can at any time:"}</T></p>
            <ul className="privacy-list">
              <li><T>{"To view your personal information"}</T></li>
              <li><T>{"To correct"}</T></li>
              <li><T>{"To request deletion"}</T></li>
              <li><T>{"To unsubscribe from marketing emails"}</T></li>
              <li><T>{"To disable cookies"}</T></li>
            </ul>
            <p style={{ marginTop: 7 }}><T>{"You can."}</T></p>
          </section>

          <section className="privacy-section">
            <h2><T>{"7. Data Retention"}</T></h2>
            <ul className="privacy-list">
              <li><T>{"Personal information is stored as long as the account exists.\r\n              "}</T></li>
              <li><T>{"Information that must be kept for legal reasons is kept for a\r\n                specific period of time.\r\n              "}</T></li>
              <li><T>{"Unnecessary information is automatically deleted."}</T></li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2><T>{"8. Policy change"}</T></h2>
            <p><T>{"We may update the Privacy Policy at any time. Your continued use\r\n              of the Website after the change will be deemed to indicate your\r\n              agreement to the new policy.\r\n            "}</T></p>
          </section>

          <section className="privacy-section">
            <h2><T>{"9. Easy Task Autofill Browser Extension"}</T></h2>
            <p><T>{"SohozKaj Autofill is our browser extension that helps you fill\r\n              government and private job forms with a single tap. Once the\r\n              browser is connected to your SohozKaj account, you can autofill\r\n              job forms on any site.\r\n            "}</T></p>

            <div className="privacy-subsection">
              <h3><T>{"9.1 How it works"}</T></h3>
              <ul className="privacy-list">
                <li><T>{"Login to your Sahajkaj account in the browser."}</T></li>
                <li><T>{"Return to the extension and press &quot;Connect this\r\n                  device&quot;\r\n                "}</T></li>
                <li><T>{"Fill out the form with your mobile number."}</T></li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3><T>{"9.2 Data collection"}</T></h3>
              <p><T>{"This extension does not collect any of your personal\r\n                information. The information used to fill out the form comes\r\n                from your Sahajkaj account and is used within your browser.\r\n                Specifically, the extension does not collect any of the\r\n                following types of data:\r\n              "}</T></p>
              <ul className="privacy-list">
                <li><T>{"Personally identifiable information (name, address, email, age\r\n                  or identification number)\r\n                "}</T></li>
                <li><T>{"Health information"}</T></li>
                <li><T>{"Financial and payment information"}</T></li>
                <li><T>{"Authentication information (password, PIN, etc.)"}</T></li>
                <li><T>{"Personal communication (email, text or chat)"}</T></li>
                <li><T>{"Location information"}</T></li>
                <li><T>{"Web History"}</T></li>
                <li><T>{"User activity (clicks, mouse movements, keystrokes, etc.)\r\n                "}</T></li>
                <li><T>{"Website content"}</T></li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3><T>{"9.3 Our Commitment"}</T></h3>
              <ul className="privacy-list">
                <li><T>{"We do not sell or transfer user data to third parties except\r\n                  for approved use cases.\r\n                "}</T></li>
                <li><T>{"We do not use or transfer user data for any purpose unrelated\r\n                  to the extension&apos;s sole purpose.\r\n                "}</T></li>
                <li><T>{"We do not use or transfer user data for the purpose of\r\n                  determining creditworthiness or granting loans.\r\n                "}</T></li>
              </ul>
            </div>
          </section>

          <section className="privacy-section" style={{ marginBottom: 25 }}>
            <h2><T>{"10. Contact us."}</T></h2>
            <p><T>{"For any privacy questions or complaints, please contact:"}</T></p>
            <p>
              <strong><T>{"Email:"}</T></strong>{<T>{" "}</T>}
              <a href="mailto:hello@sohozkaj.com"><T>{"hello@sohozkaj.com"}</T></a>
              <br />
              <strong><T>{"Phone:"}</T></strong><T>{"+88 01700-559595\r\n              "}</T><br />
              <strong><T>{"Website:"}</T></strong>{<T>{" "}</T>}
              <a href="https://www.sohozkaj.com" target="_blank" rel="noreferrer"><T>{"www.sohozkaj.com\r\n              "}</T></a>
            </p>
          </section>

          <div className="privacy-divider"/>

          <div className="privacy-closing">
            <p><T>{"By using Simple Tasks, you will be deemed to have accepted all the\r\n              terms of this Privacy Policy.\r\n            "}</T></p>
          </div>
        </article>
      </div>

      <Footer />

      <a className="whatsapp" href="https://wa.me/8801700559595" aria-label="WhatsApp">
        <WhatsAppIcon />
      </a>
    </main>);
}
