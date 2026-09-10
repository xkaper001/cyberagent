export type ViewType = 
  | 'chat' 
  | 'dashboard' 
  | 'assessments' 
  | 'findings' 
  | 'reports' 
  | 'knowledge' 
  | 'agents';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingStatus = 'active' | 'investigating' | 'remediated';

export type AgentType = 
  | 'supervisor' 
  | 'planner' 
  | 'recon' 
  | 'scanning' 
  | 'vulnerability' 
  | 'research' 
  | 'risk' 
  | 'critic' 
  | 'report';

export type AgentStepStatus = 
  | 'idle'
  | 'queued'
  | 'thinking'
  | 'planning'
  | 'waiting'
  | 'running'
  | 'parsing'
  | 'analyzing'
  | 'validating'
  | 'approval_required'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled'
  | 'skipped';

export interface AgentStep {
  id: string;
  agentName: string;
  agentType: AgentType;
  status: AgentStepStatus;
  duration?: string;
  summary: string;
  details?: string;
  explanation?: string;
}

export interface SupervisorInterpretation {
  requestClassified: string;
  target: string;
  scope: string;
  summary: string;
}

export interface PlanStepItem {
  id: string;
  title: string;
  assigned_agent: string;
  status: 'completed' | 'running' | 'pending' | 'failed' | 'blocked';
  detail?: string;
}

export interface SupervisorDelegation {
  fromAgent: string;
  toAgent: string;
  task: string;
  priority: string;
  status?: string;
}

export interface SupervisorDecision {
  agent: string;
  decision: string;
  reason: string;
  nextStep: string;
  timestamp?: string;
}

export interface ToolExecutionCardState {
  id: string;
  agent: string;
  toolName: string;
  profile?: string;
  target?: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'error';
  input: Record<string, any>;
  output?: Record<string, any> | string;
  duration?: string;
  timestamp: string;
  evidenceCount?: number;
  stdoutRaw?: string;
  stderrRaw?: string;
  stderr?: string;
  exitCode?: number;
  error?: any;
}

export interface EvidenceArtifact {
  id: string;
  sourceAgent: string;
  toolName: string;
  capturedAt: string;
  confidence: number;
  summary: string;
  hash: string;
}

export interface CriticResult {
  agent: string;
  status: 'VALIDATED' | 'INSUFFICIENT';
  confidence: number;
  summary: string;
  decision: string;
}

export interface AgentActivity {
  id: string;
  title: string;
  steps: AgentStep[];
  isExpanded?: boolean;
  supervisorInterpretation?: SupervisorInterpretation;
  planSteps?: PlanStepItem[];
  delegations?: SupervisorDelegation[];
  decisions?: SupervisorDecision[];
  toolExecutions?: ToolExecutionCardState[];
  evidenceArtifacts?: EvidenceArtifact[];
  criticResult?: CriticResult;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  command: string;
  output: string;
  status: 'success' | 'running' | 'error';
  timestamp: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence: number; // percentage, e.g., 94
  asset: string;
  targetIp: string;
  status: FindingStatus;
  category: string;
  evidence: string[];
  impact: string;
  remediation: string;
  cveId?: string;
  cweId?: string;
  firstDetected: string;
  lastUpdated: string;
  agentActivitySummary?: string;
  references?: string[];
}

export interface Assessment {
  id: string;
  title: string;
  target?: string;
  targetIp?: string;
  targets?: string[];
  excluded_targets?: string[];
  scope?: string;
  environment: 'Lab' | 'Internal' | 'Authorized Cloud' | 'Production (Approved)';
  status: 'awaiting_target' | 'unconfirmed' | 'in_progress' | 'completed' | 'paused';
  authorization_status?: 'unconfirmed' | 'confirmed';
  authorization_confirmed_at?: string;
  authorization_method?: 'user_confirmation' | 'explicit_config';
  riskScore: number; // e.g. 8.4
  progressPhases: {
    recon: boolean;
    serviceAnalysis: boolean;
    vulnerabilityResearch: 'completed' | 'in_progress' | 'pending';
    riskAssessment: boolean;
    report: boolean;
  };
  openServices: { port: number; service: string; version: string; banner?: string }[];
  techStack: string[];
  verifiedFindingsCount: number;
  createdAt: string;
}

export interface SecurityReport {
  id: string;
  title: string;
  date: string;
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  findingsCount: number;
  status: 'Completed' | 'Draft';
  target: string;
  executiveSummary: string;
  attackSurface: string;
  findingsSummary: { critical: number; high: number; medium: number; low: number; info: number };
  remediationRoadmap: string[];
  author: string;
}

export interface KnowledgeItem {
  id: string;
  cveId?: string;
  cweId?: string;
  title: string;
  severity: Severity;
  category: 'OWASP' | 'MITRE ATT&CK' | 'CWE' | 'CVE' | 'Research';
  affectedTech: string;
  summary: string;
  remediation: string;
  cvssScore?: number;
  source: string;
  updatedDate: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  type: AgentType;
  purpose: string;
  status: 'Ready' | 'Executing' | 'Idle' | 'Maintenance';
  tools: string[];
  lastActivity: string;
  executionsCount: number;
  iconName: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'log' | 'pcap' | 'nmap' | 'image' | 'code';
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentActivity?: AgentActivity;
  toolExecutions?: ToolExecution[];
  findings?: Finding[];
  references?: string[];
  attachments?: FileAttachment[];
}

export interface HumanApproval {
  id: string;
  agentName: string;
  action: string;
  target: string;
  reason: string;
  expectedOutcome: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}
