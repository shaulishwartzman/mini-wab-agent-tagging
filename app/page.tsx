/**
 * Main page for the AI Governance & Agent Risk Assessment Platform.
 *
 * COMPONENTS:
 * - RoleSwitcher: MVP testing mode role selector (top banner)
 * - AgentForm: Agent assessment questionnaire and request management
 *
 * @see components/RoleSwitcher.tsx - Role switching UI
 * @see components/AgentForm.tsx - Main form component
 */

import AgentForm from "@/components/AgentForm";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export default function Page() {
  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #eaecf0",
    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
    width: "100%",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#101828",
    margin: "0 0 24px 0",
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "-0.02em",
  };

  return (
    <>
      {/* MVP Testing Mode Banner */}
      <RoleSwitcher />

      <main
        style={{
          padding: "48px 32px",
          display: "grid",
          gap: "40px",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
        }}
      >
        <div style={{ width: "100%", display: "grid", gap: "40px" }}>
          <section style={cardStyle}>
            <h2 style={titleStyle}>Agent Approval Management</h2>
            <AgentForm />
          </section>
        </div>

      <footer
        style={{
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          padding: "24px 20px",
          textAlign: "center",
          fontSize: 13,
          lineHeight: 1.6,
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "center",
          }}
        >
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>
            נבנה על ידי <span style={{ color: "#38bdf8" }}>LEEH</span>{" "}
            &copy; {new Date().getFullYear()}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 4,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span>
              ליצירת קשר ותמיכה:{" "}
              <strong>Shauli Shwartzman</strong>
            </span>
            <span>|</span>
            <span>
              <a
                href="mailto:shauli.sh321@gmail.com"
                style={{ color: "#38bdf8", textDecoration: "none" }}
              >
                shauli.sh321@gmail.com
              </a>
            </span>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}
