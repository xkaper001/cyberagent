export interface AgentInfo {
  order: number;
  type: string;
  name: string;
  role: string;
  tools: string[];
  live: boolean;
}

// The real LangGraph pipeline order (backend/graph/workflow.py).
export const PIPELINE: AgentInfo[] = [
  { order: 1, type: 'supervisor', name: 'Supervisor', role: 'Validates scope + authorization, orchestrates the run.', tools: ['scope validator'], live: true },
  { order: 2, type: 'planner', name: 'Planner', role: 'Turns the request into an ordered, in-scope plan.', tools: ['strategy graph'], live: true },
  { order: 3, type: 'recon', name: 'Recon', role: 'DNS resolution + HTTP header/banner inspection.', tools: ['dns_lookup', 'http_probe'], live: true },
  { order: 4, type: 'scanning', name: 'Scanning', role: 'Authorized nmap -sV service + version discovery.', tools: ['nmap'], live: true },
  { order: 5, type: 'research', name: 'Research', role: 'Correlates service versions against NVD advisories.', tools: ['NVD (CPE)'], live: true },
  { order: 6, type: 'vulnerability', name: 'Vulnerability', role: 'Emits CVE findings with evidence from real tool output.', tools: ['NVD (CPE)'], live: true },
  { order: 7, type: 'critic', name: 'Critic', role: 'LLM-scores each finding’s confidence, rejects weak matches.', tools: ['LLM'], live: true },
  { order: 8, type: 'risk', name: 'Risk', role: 'Composite CVSS-based risk over retained findings.', tools: ['CVSS'], live: true },
  { order: 9, type: 'report', name: 'Report', role: 'Builds the report + summary from actual findings.', tools: ['—'], live: true },
];
