export interface ToolInfo {
  name: string;
  role: string;
  kind: 'recon' | 'scan' | 'intel' | 'advisory' | 'control';
  live: boolean;
}

// The toolbox the autonomous agent chooses from (backend/agents/autonomous.py).
// There is no fixed order — the LLM decides what to call and when.
export const TOOLBOX: ToolInfo[] = [
  { name: 'dns_lookup', role: 'Resolve DNS A records for the target.', kind: 'recon', live: true },
  { name: 'http_headers', role: 'Fetch HTTP response headers / server banner.', kind: 'recon', live: true },
  { name: 'port_scan', role: 'Authorized nmap -sV service + version scan.', kind: 'scan', live: true },
  { name: 'cve_search', role: 'Map a discovered service/CPE to real NVD CVEs.', kind: 'intel', live: true },
  { name: 'exploit_advisor', role: 'Remediation / PoC guidance for a CVE. Advice only — never executes.', kind: 'advisory', live: true },
  { name: 'record_finding', role: 'Register a confirmed, evidence-backed finding.', kind: 'control', live: true },
  { name: 'finish', role: 'Conclude with a risk summary once evidence is gathered.', kind: 'control', live: true },
];
