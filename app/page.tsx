import AgentForm from "@/components/AgentForm";
import WebhookSender from "@/components/AgentEmailSender";

export default function Page() {
  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #eaecf0",
    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
    width: "100%", // מבטיח שהכרטיס יתפוס את מלוא הרוחב של המיכל
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
    <main style={{ 
      padding: "48px 32px", 
      display: "grid", 
      gap: "40px", 
      width: "100%",        // תופס את כל רוחב המסך
      boxSizing: "border-box",
      backgroundColor: "#f8f9fa", // רקע מודרני בהיר לכל המסך
      minHeight: "100vh"    // ממלא את כל גובה המסך
    }}>
      <div style={{ width: "100%", display: "grid", gap: "40px" }}>
        <section style={cardStyle}>
          <h2 style={titleStyle}>Agent Tagging</h2>
          <AgentForm />
        </section>

        <section style={cardStyle}>
          <h2 style={titleStyle}>Email Sender</h2>
          <WebhookSender />
        </section>
      </div>
    </main>
  );
}