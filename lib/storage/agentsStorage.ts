export type AgentCard = {
  id: string;
  agentName: string;
  agentLevel: string;
  classification: {
    autonomy: string;
    brain: string;
    capability: string;
    management: string;
  };
  classificationExplanation: Record<string, string>;
  governance: {
    agentOwner: string;
    technicalOwner: string;
    changeApprover: string;
    oversightMechanism: string;
  };
  riskScenarios: string[];
};

const STORAGE_KEY = "agents";

/**
 * שליפת כל כרטיסי הסוכנים השמורים מה-LocalStorage
 */
export function getAgents(): AgentCard[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * שמירת מערך שלם של סוכנים ב-LocalStorage
 */
export function saveAgents(agents: AgentCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

/**
 * מחיקת סוכן ספציפי לפי ה-ID שלו ושמירה מחדש של הרשימה המעודכנת
 */
export function deleteAgent(id: string) {
  if (typeof window === "undefined") return;

  const currentAgents = getAgents();
  const updatedAgents = currentAgents.filter((agent) => agent.id !== id);
  saveAgents(updatedAgents);
}