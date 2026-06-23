type Answers = Record<string, string>;

type Option = {
  option_id: string;
  label: string;
};

type Question = {
  question_id: string;
  question_text: string;
  options: Option[];
};

type Fields = Question[];

export type AgentCard = {
  id: string;
  agentName: string;

  classification: {
    autonomy: string;
    brain: string;
    capability: string;
    management: string;
  };

  agentLevel: string;

  classificationExplanation: Record<string, string>;

  governance: {
    agentOwner: string;
    technicalOwner: string;
    accountableOwner: string;
    changeApprover: string;
    oversightMechanism: string;
    oversightOwner: string;
  };

  riskScenarios: string[];
};

const riskMap: Record<string, string[]> = {
  A1: [
    "Users may repeat inconsistent workflows due to lack of task continuity.",
    "Critical steps may be missed when instructions are incomplete.",
  ],
  A2: [
    "Incorrect task decomposition may lead to inefficient execution.",
  ],
  A3: [
    "Autonomous execution may drift from intended business goals.",
  ],

  B1: ["Prompt injection risk or model instability."],
  B2: ["Bias or outdated knowledge may affect outputs."],
  B3: ["Cross-model dependency failures may propagate issues."],

  C1: ["Hallucinated information may affect decisions."],
  C2: ["Tool misuse or unintended API actions."],
  C3: ["Generated tools may introduce security vulnerabilities."],

  M1: ["Single point of failure in execution layer."],
  M2: ["Agent coordination loops may occur."],
  M3: ["Orchestration layer failure impacts multiple agents."],
};

export function createAgentCard(params: {
  agentName: string;
  answers: Answers;
  fields: Fields;
}): AgentCard {
  const { agentName, answers, fields } = params;

  const getAnswer = (qid: string) => answers[qid];

  const getLabel = (qid: string, optionId: string) => {
    const question = fields.find((q) => q.question_id === qid);
    const option = question?.options.find(
      (o) => o.option_id === optionId
    );
    return option?.label || optionId;
  };

  const autonomy = getAnswer("q1_autonomy") || "A1";
  const brain = getAnswer("q2_brain") || "B1";
  const capability = getAnswer("q3_capability") || "C1";
  const management = getAnswer("q4_management") || "M1";

  const agentLevel = `${autonomy}-${brain}-${capability}-${management}`;

  const pick = (key?: string) => (key ? riskMap[key] || [] : []);

  const riskScenarios = [
    ...pick(autonomy),
    ...pick(brain),
    ...pick(capability),
    ...pick(management),
  ];

  return {
    id: crypto.randomUUID(), // ✅ זה הקריטי שהיה חסר קודם

    agentName,

    classification: {
      autonomy,
      brain,
      capability,
      management,
    },

    agentLevel,

    classificationExplanation: {
      autonomy: getLabel("q1_autonomy", autonomy),
      brain: getLabel("q2_brain", brain),
      capability: getLabel("q3_capability", capability),
      management: getLabel("q4_management", management),
    },

    governance: {
      agentOwner: "",
      technicalOwner: "",
      accountableOwner: "",
      changeApprover: "",
      oversightMechanism: "",
      oversightOwner: "",
    },

    riskScenarios,
  };
}