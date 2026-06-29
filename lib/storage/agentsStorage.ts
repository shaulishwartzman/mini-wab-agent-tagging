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

export function getAgents(): AgentCard[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAgents(agents: AgentCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}