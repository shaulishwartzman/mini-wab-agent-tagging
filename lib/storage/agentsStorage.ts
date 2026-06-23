import type { AgentCard } from "@/lib/agent-engine/createAgentCard";

const STORAGE_KEY = "agents";

export function getAgents(): AgentCard[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);

  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAgent(agent: AgentCard) {
  const current = getAgents();
  const updated = [...current, agent];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteAgent(id: string) {
  const current = getAgents();
  const updated = current.filter((a) => a.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}