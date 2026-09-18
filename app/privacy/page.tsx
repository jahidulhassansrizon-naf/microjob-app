"use client";

import Footer from "@/components/Footer";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="whatsapp-icon">
      <circle
        cx="12"
        cy="12"
        r="8.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.4 18.6 7.4 21l2.4-1.1A8.7 8.7 0 1 0 8.4 18.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 9.2c.15-.34.32-.35.6-.35h.45c.2 0 .34.1.42.32l.62 1.45c.08.2.04.38-.08.54l-.4.5c-.11.13-.12.25-.04.4.33.6 1.2 1.54 2.36 1.98.19.08.3.05.41-.07l.55-.67c.13-.16.3-.2.49-.1l1.39.65c.2.1.27.23.24.45-.05.39-.33 1.04-.91 1.34-.48.25-1.24.22-2.1-.13-.73-.3-1.61-.88-2.54-1.75-.77-.73-1.56-1.77-1.91-2.48-.32-.64-.38-1.2-.18-1.64Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MiniTools() {
  return (
    <div className="mini-tools" aria-hidden="true">
      <div className="mini-tool black">◉</div>
      <div className="mini-tool cyan">⌣</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <style>{`
        .privacy-page {
          min-height: 100vh;
          background: #f3f3f3;
          color: #17202b;
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
          background: #fff;
          border: 1px solid #e5e5e8;
          border-radius: 14px;
          box-shadow:
            0 1px 2px rgba(16, 24, 40, .018),
            0 4px 12px rgba(16, 24, 40, .025);
          padding: 61px 54px 39px;
        }

        .privacy-title {
          margin: 0;
          padding-bottom: 16px;
          border-bottom: 1px solid #202327;
          color: #121821;
          font-size: 29px;
          line-height: 1.16;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .privacy-intro {
          margin: 31px 0 37px;
          color: #27303a;
          font-size: 16px;
          line-height: 1.48;
          letter-spacing: -0.1px;
        }

        .privacy-section {
          margin: 0 0 31px;
        }

        .privacy-section h2 {
          margin: 0 0 15px;
          color: #111722;
          font-size: 18px;
          line-height: 1.22;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .privacy-section h3 {
          margin: 0 0 10px;
          color: #111722;
          font-size: 16px;
          line-height: 1.24;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .privacy-section p {
          margin: 0 0 11px;
          color: #34404c;
          font-size: 14px;
          line-height: 1.47;
          letter-spacing: -0.04px;
        }

        .privacy-list {
          margin: 0;
          padding-left: 27px;
          color: #34404c;
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
          color: #2678da;
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
          border-top: 1px solid #202327;
        }

        .privacy-closing {
          margin-top: 23px;
          text-align: center;
          color: #32404c;
          font-size: 14px;
          line-height: 1.42;
        }

        .privacy-closing p {
          margin: 0;
        }

        .mini-tools {
          position: fixed;
          right: 0;
          top: 154px;
          display: flex;
          flex-direction: column;
          gap: 9px;
          z-index: 45;
        }

        .mini-tool {
          width: 33px;
          height: 35px;
          display: grid;
          place-items: center;
          box-shadow: 0 3px 8px rgba(0,0,0,.12);
        }

        .mini-tool.black {
          width: 31px;
          height: 31px;
          margin-right: 2px;
          border-radius: 50%;
          background: #000;
          color: #fff;
          font-size: 14px;
        }

        .mini-tool.cyan {
          background: #2ac1ef;
          color: #153d4f;
          border: 1px solid #1da5cd;
          font-size: 20px;
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
          background: #21d36a;
          color: #fff;
          text-decoration: none;
          box-shadow: 0 11px 24px rgba(33, 211, 106, .25);
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

          .mini-tools {
            display: none;
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
          <h1 className="privacy-title">Privacy Policy</h1>

          <div className="privacy-intro">
            <p>
              Easy Work (&quot;we&quot;, &quot;us&quot;, &quot;website&quot;) is
              committed to ensuring the privacy of your personal information.
              This Privacy Policy explains how we collect, use and protect your
              information.
            </p>
            <p>By using our website, you agree to this policy.</p>
          </div>

          <section className="privacy-section">
            <h2>1. What information do we collect?</h2>

            <div className="privacy-subsection">
              <h3>1.1 Information you provide directly</h3>
              <ul className="privacy-list">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number (if applicable)</li>
                <li>Account registration information</li>
                <li>
                  Payment information (but we never store card numbers or CVVs)
                </li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3>1.2 Automatically collected information</h3>
              <ul className="privacy-list">
                <li>Browser type</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Website usage analytics</li>
                <li>Page views, number of downloads, click patterns, etc.</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3>1.3 Cookies</h3>
              <p>
                We use cookies to improve user experience. They are governed by
                our Cookie Policy.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>2. How do we use this information?</h2>
            <p>Your information is used:</p>
            <ul className="privacy-list">
              <li>To create and manage your account</li>
              <li>
                For purchasing credit packages and providing AI services
                (images, documents, prints, templates and tools)
              </li>
              <li>To send order confirmation or receipt by email</li>
              <li>To notify about new templates, updates or offers</li>
              <li>For website development and analysis</li>
              <li>To prevent fraud and ensure security</li>
              <li>To provide support as requested.</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              We never unnecessarily collect or misuse your personal
              information.
            </p>
          </section>

          <section className="privacy-section">
            <h2>3. Is your information shared with anyone else?</h2>
            <p>
              Easy Work does not sell or rent your personal information.
              However, information may be shared in the following circumstances:
            </p>

            <div className="privacy-subsection">
              <h3>3.1 Trusted third parties (Third-party services)</h3>
              <ul className="privacy-list">
                <li>Payment gateway (e.g. SSLCommerz, Stripe)</li>
                <li>Analytics tools (e.g. Google Analytics)</li>
                <li>Email service (e.g. MailerLite / SendGrid)</li>
              </ul>
              <p style={{ marginTop: 7 }}>
                They only see the information necessary to provide the service.
              </p>
            </div>

            <div className="privacy-subsection">
              <h3>3.2 As required by law</h3>
              <p>
                Information may need to be provided upon legal request from
                government agencies or courts.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>4. How do we protect your information?</h2>
            <p>We take the following measures to protect information:</p>
            <ul className="privacy-list">
              <li>SSL encryption</li>
              <li>Secure server</li>
              <li>Regular security updates</li>
              <li>Limited access control</li>
              <li>Firewall preventing unauthorized access</li>
            </ul>

            <p style={{ marginTop: 19 }}>
              Additionally, as much of the work as possible, such as background
              removal, image compression, HEIC conversion, and PDF/Excel
              creation, is done in your browser—so files aren&apos;t always sent
              to the server. We take the necessary security measures to keep
              user input and content safe, and use secure one-time connections
              to fetch images from mobile. Access to each account is limited
              based on user role.
            </p>

            <p>
              However, it is not possible to ensure 100% security of the
              Internet, and this risk is accepted by any Internet user.
            </p>
          </section>

          <section className="privacy-section">
            <h2>5. Children&apos;s privacy</h2>
            <p>
              Easy Work does not collect information from anyone under the age
              of 18. If any information is collected in error, we will promptly
              delete it.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. User rights</h2>
            <p>You can at any time:</p>
            <ul className="privacy-list">
              <li>To view your personal information</li>
              <li>To correct</li>
              <li>To request deletion</li>
              <li>To unsubscribe from marketing emails</li>
              <li>To disable cookies</li>
            </ul>
            <p style={{ marginTop: 7 }}>You can.</p>
          </section>

          <section className="privacy-section">
            <h2>7. Data Retention</h2>
            <ul className="privacy-list">
              <li>
                Personal information is stored as long as the account exists.
              </li>
              <li>
                Information that must be kept for legal reasons is kept for a
                specific period of time.
              </li>
              <li>Unnecessary information is automatically deleted.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>8. Policy change</h2>
            <p>
              We may update the Privacy Policy at any time. Your continued use
              of the Website after the change will be deemed to indicate your
              agreement to the new policy.
            </p>
          </section>

          <section className="privacy-section">
            <h2>9. Easy Task Autofill Browser Extension</h2>
            <p>
              SohozKaj Autofill is our browser extension that helps you fill
              government and private job forms with a single tap. Once the
              browser is connected to your SohozKaj account, you can autofill
              job forms on any site.
            </p>

            <div className="privacy-subsection">
              <h3>9.1 How it works</h3>
              <ul className="privacy-list">
                <li>Login to your Sahajkaj account in the browser.</li>
                <li>
                  Return to the extension and press &quot;Connect this
                  device&quot;
                </li>
                <li>Fill out the form with your mobile number.</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3>9.2 Data collection</h3>
              <p>
                This extension does not collect any of your personal
                information. The information used to fill out the form comes
                from your Sahajkaj account and is used within your browser.
                Specifically, the extension does not collect any of the
                following types of data:
              </p>
              <ul className="privacy-list">
                <li>
                  Personally identifiable information (name, address, email, age
                  or identification number)
                </li>
                <li>Health information</li>
                <li>Financial and payment information</li>
                <li>Authentication information (password, PIN, etc.)</li>
                <li>Personal communication (email, text or chat)</li>
                <li>Location information</li>
                <li>Web History</li>
                <li>
                  User activity (clicks, mouse movements, keystrokes, etc.)
                </li>
                <li>Website content</li>
              </ul>
            </div>

            <div className="privacy-subsection">
              <h3>9.3 Our Commitment</h3>
              <ul className="privacy-list">
                <li>
                  We do not sell or transfer user data to third parties except
                  for approved use cases.
                </li>
                <li>
                  We do not use or transfer user data for any purpose unrelated
                  to the extension&apos;s sole purpose.
                </li>
                <li>
                  We do not use or transfer user data for the purpose of
                  determining creditworthiness or granting loans.
                </li>
              </ul>
            </div>
          </section>

          <section className="privacy-section" style={{ marginBottom: 25 }}>
            <h2>10. Contact us.</h2>
            <p>For any privacy questions or complaints, please contact:</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:hello@sohozkaj.com">hello@sohozkaj.com</a>
              <br />
              <strong>Phone:</strong> +88 01700-559595
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
          </section>

          <div className="privacy-divider" />

          <div className="privacy-closing">
            <p>
              By using Simple Tasks, you will be deemed to have accepted all the
              terms of this Privacy Policy.
            </p>
          </div>
        </article>
      </div>

      <Footer />

      <MiniTools />

      <a
        className="whatsapp"
        href="https://wa.me/8801700559595"
        aria-label="WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </main>
  );
}
