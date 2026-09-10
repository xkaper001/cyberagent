import { 
  Finding, 
  Assessment, 
  SecurityReport, 
  KnowledgeItem, 
  AgentProfile, 
  Message, 
  AgentActivity, 
  HumanApproval 
} from '../types/cyber';

// Pre-populated demo data
export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'asm-1',
    title: 'Lab Web Assessment',
    target: 'Authorized Lab Environment',
    targetIp: '10.10.14.5 / web-lab.internal',
    environment: 'Lab',
    status: 'in_progress',
    riskScore: 8.4,
    progressPhases: {
      recon: true,
      serviceAnalysis: true,
      vulnerabilityResearch: 'in_progress',
      riskAssessment: false,
      report: false,
    },
    openServices: [
      { port: 80, service: 'http', version: 'Apache httpd 2.4.49', banner: 'HTTP/1.1 200 OK Server: Apache/2.4.49' },
      { port: 443, service: 'https', version: 'OpenSSL 1.1.1k', banner: 'TLSv1.3 ECDHE-RSA-AES256-GCM-SHA384' },
      { port: 8080, service: 'http-proxy', version: 'Spring Boot 2.3.1.RELEASE', banner: 'JVM 11.0.11 Actuator Endpoint Exposed' },
      { port: 22, service: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu 4ubuntu0.5', banner: 'SSH-2.0-OpenSSH_8.2p1' },
      { port: 5432, service: 'postgresql', version: 'PostgreSQL DB 13.4', banner: 'PostgreSQL 13.4 on x86_64-pc-linux-gnu' },
    ],
    techStack: ['Apache 2.4.49', 'Spring Boot 2.3.1', 'PostgreSQL 13.4', 'Ubuntu Linux', 'OpenSSL 1.1.1k'],
    verifiedFindingsCount: 4,
    createdAt: '2026-09-09T14:32:00Z',
  },
  {
    id: 'asm-2',
    title: 'Internal Network Review',
    target: 'Corp Staging Subnet',
    targetIp: '192.168.10.0/24',
    environment: 'Internal',
    status: 'completed',
    riskScore: 6.2,
    progressPhases: {
      recon: true,
      serviceAnalysis: true,
      vulnerabilityResearch: 'completed',
      riskAssessment: true,
      report: true,
    },
    openServices: [
      { port: 445, service: 'smb', version: 'Samba 4.11.6' },
      { port: 3389, service: 'ms-wbt-server', version: 'RDP Terminal Services' },
    ],
    techStack: ['Windows Server 2019', 'Samba', 'Active Directory'],
    verifiedFindingsCount: 6,
    createdAt: '2026-09-08T09:15:00Z',
  },
  {
    id: 'asm-3',
    title: 'API Security Analysis',
    target: 'Payment Gateway Staging',
    targetIp: 'api-stage.payments.lab',
    environment: 'Authorized Cloud',
    status: 'completed',
    riskScore: 3.5,
    progressPhases: {
      recon: true,
      serviceAnalysis: true,
      vulnerabilityResearch: 'completed',
      riskAssessment: true,
      report: true,
    },
    openServices: [
      { port: 443, service: 'https', version: 'NGINX 1.20.1' },
    ],
    techStack: ['Node.js Express', 'NGINX', 'Redis'],
    verifiedFindingsCount: 2,
    createdAt: '2026-09-05T11:20:00Z',
  },
  {
    id: 'asm-4',
    title: 'Vulnerability Investigation',
    target: 'Authentication Service',
    targetIp: 'auth-v2.internal.lab',
    environment: 'Lab',
    status: 'completed',
    riskScore: 9.1,
    progressPhases: {
      recon: true,
      serviceAnalysis: true,
      vulnerabilityResearch: 'completed',
      riskAssessment: true,
      report: true,
    },
    openServices: [
      { port: 80, service: 'http', version: 'Apache 2.4.49' },
      { port: 6379, service: 'redis', version: 'Redis 5.0.7' },
    ],
    techStack: ['Python FastAPI', 'Redis', 'Docker'],
    verifiedFindingsCount: 8,
    createdAt: '2026-09-02T16:45:00Z',
  },
];

export const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'fnd-101',
    title: 'Path Traversal & RCE in Apache httpd (CVE-2021-41773)',
    severity: 'critical',
    confidence: 96,
    asset: 'Authorized Lab Web Server (10.10.14.5)',
    targetIp: '10.10.14.5:80',
    status: 'active',
    category: 'Remote Code Execution',
    evidence: [
      'GET /icons/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd HTTP/1.1 returned HTTP 200 with root entry.',
      'mod_cgi enabled allowing POST payload execution via CGI script path mapping.',
      'Verified with read-only probe response header: Server: Apache/2.4.49 (Unix).'
    ],
    impact: 'Unauthenticated attacker can traverse outside the document root and execute arbitrary code under the web daemon account context.',
    remediation: 'Immediately upgrade Apache httpd to version 2.4.51 or higher. Disable CGI execution module if not strictly required.',
    cveId: 'CVE-2021-41773',
    cweId: 'CWE-22',
    firstDetected: '2026-09-09T14:35:12Z',
    lastUpdated: '2026-09-09T14:38:00Z',
    agentActivitySummary: 'Identified by Scanning Agent via HTTP banner analysis and validated by Vulnerability Research Agent.',
    references: [
      'https://nvd.nist.gov/vuln/detail/CVE-2021-41773',
      'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-41773'
    ]
  },
  {
    id: 'fnd-102',
    title: 'Exposed Spring Boot Actuator Env Endpoint',
    severity: 'high',
    confidence: 94,
    asset: 'Internal API Gateway (10.10.14.5:8080)',
    targetIp: '10.10.14.5:8080',
    status: 'active',
    category: 'Information Disclosure',
    evidence: [
      'GET /actuator/env returns 200 OK with full Spring environment configuration parameters.',
      'Active database credentials string observed partially masked in heap properties.',
      'Spring Actuator endpoints /actuator/heapdump and /actuator/configprops publicly reachable.'
    ],
    impact: 'Exposure of sensitive application configuration details, environment keys, and internal service credentials to unauthenticated users.',
    remediation: 'Secure endpoints by restricting management.endpoints.web.exposure.include to health only or requiring authenticated admin credentials.',
    cveId: 'CWE-200',
    cweId: 'CWE-200',
    firstDetected: '2026-09-09T14:36:04Z',
    lastUpdated: '2026-09-09T14:36:04Z',
    agentActivitySummary: 'Discovered during Recon Agent web crawler tech stack fingerprinting.',
    references: [
      'https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html'
    ]
  },
  {
    id: 'fnd-103',
    title: 'Missing Security Headers (HSTS, CSP, X-Frame-Options)',
    severity: 'medium',
    confidence: 100,
    asset: 'Web Application Frontend (10.10.14.5:443)',
    targetIp: '10.10.14.5:443',
    status: 'active',
    category: 'Security Hardening',
    evidence: [
      'HTTP response missing Strict-Transport-Security header.',
      'HTTP response missing Content-Security-Policy header.',
      'HTTP response missing X-Frame-Options header.'
    ],
    impact: 'Increased vulnerability to Clickjacking attacks, Man-in-the-Middle downgrades, and Cross-Site Scripting (XSS) exploitation.',
    remediation: 'Configure web server to inject Strict-Transport-Security, Content-Security-Policy, X-Frame-Options: DENY, and X-Content-Type-Options: nosniff headers.',
    cveId: 'CWE-693',
    cweId: 'CWE-693',
    firstDetected: '2026-09-09T14:33:50Z',
    lastUpdated: '2026-09-09T14:33:50Z',
    agentActivitySummary: 'Evaluated by Recon Agent during initial HTTP response inspection.',
    references: [
      'https://owasp.org/www-project-secure-headers/'
    ]
  },
  {
    id: 'fnd-104',
    title: 'OpenSSH Outdated Key Exchange Algorithms',
    severity: 'low',
    confidence: 88,
    asset: 'Lab SSH Service (10.10.14.5:22)',
    targetIp: '10.10.14.5:22',
    status: 'investigating',
    category: 'Cryptographic Weakness',
    evidence: [
      'SSH service negotiation allows diffie-hellman-group1-sha1 key exchange.',
      'Ciphers include legacy 3des-cbc.'
    ],
    impact: 'Potential cipher suite degradation under active cryptanalytic interception on localized transit segments.',
    remediation: 'Disable legacy KEX algorithms and ciphers in sshd_config. Enforce curve25519-sha256 and chacha20-poly1305.',
    cveId: 'CWE-327',
    cweId: 'CWE-327',
    firstDetected: '2026-09-09T14:34:10Z',
    lastUpdated: '2026-09-09T14:34:10Z',
    agentActivitySummary: 'Captured by Scanning Agent port 22 cipher audit.',
    references: [
      'https://www.ssh.com/academy/ssh/sshd_config'
    ]
  },
  {
    id: 'fnd-105',
    title: 'Default PostgreSQL Service Identification',
    severity: 'info',
    confidence: 98,
    asset: 'Database Host (10.10.14.5:5432)',
    targetIp: '10.10.14.5:5432',
    status: 'active',
    category: 'Service Enumeration',
    evidence: [
      'PostgreSQL banner: PostgreSQL 13.4 on x86_64-pc-linux-gnu.',
      'Authentication protocol requested: md5.'
    ],
    impact: 'Service exposed to local network subnet; potential target for password spraying if weak default credentials exist.',
    remediation: 'Restrict database listener binding to localhost or isolate behind private VPC security groups with strict IP whitelist.',
    cveId: 'CWE-200',
    firstDetected: '2026-09-09T14:34:25Z',
    lastUpdated: '2026-09-09T14:34:25Z',
    agentActivitySummary: 'Discovered by Scanning Agent.',
    references: []
  }
];

export const INITIAL_REPORTS: SecurityReport[] = [
  {
    id: 'rep-1',
    title: 'Lab Web Assessment & Attack Surface Security Report',
    date: 'September 9, 2026',
    riskScore: 8.4,
    riskLevel: 'High',
    findingsCount: 5,
    status: 'Completed',
    target: 'Authorized Lab Environment (10.10.14.5)',
    author: 'CyberAgents AI Security Copilot',
    executiveSummary: 'CyberAgents completed an automated, multi-agent security assessment of the authorized lab environment (10.10.14.5). The assessment identified 1 Critical RCE vulnerability (CVE-2021-41773) in Apache httpd 2.4.49, 1 High severity credential exposure in Spring Boot Actuator endpoints, and multiple security configuration deficiencies.',
    attackSurface: '5 open network ports identified across HTTP (80), HTTPS (443), Spring Gateway (8080), SSH (22), and PostgreSQL (5432). High concentration of attack vectors located on web services.',
    findingsSummary: { critical: 1, high: 1, medium: 1, low: 1, info: 1 },
    remediationRoadmap: [
      'Patch Apache httpd to 2.4.51+ immediately to mitigate CVE-2021-41773 RCE.',
      'Restrict Spring Boot Actuator endpoints (/actuator/env, /actuator/heapdump).',
      'Inject standard OWASP security headers (HSTS, CSP, X-Frame-Options) across web proxy.',
      'Harden SSH daemon configuration by deprecating diffie-hellman-group1-sha1.',
      'Restrict PostgreSQL listener binding to internal host loopback interface.'
    ]
  },
  {
    id: 'rep-2',
    title: 'Staging Subnet Network Security Review',
    date: 'September 8, 2026',
    riskScore: 6.2,
    riskLevel: 'Medium',
    findingsCount: 6,
    status: 'Completed',
    target: 'Corp Staging Subnet (192.168.10.0/24)',
    author: 'CyberAgents AI Security Copilot',
    executiveSummary: 'Comprehensive network review of 24 hosts on corporate staging subnet. Discovered outdated Samba SMB implementation alongside exposed Remote Desktop protocol listeners with unconstrained NLA configuration.',
    attackSurface: '24 active host IPs, SMB 445 exposed on 4 hosts, RDP 3389 open on 2 host controllers.',
    findingsSummary: { critical: 0, high: 2, medium: 3, low: 1, info: 0 },
    remediationRoadmap: [
      'Enforce SMB Signing and upgrade Samba packages on staging cluster.',
      'Require Network Level Authentication (NLA) on all active RDP endpoints.',
      'Segregate staging subnet from internal developer workstation VLANs.'
    ]
  }
];

export const INITIAL_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kn-1',
    cveId: 'CVE-2021-41773',
    cweId: 'CWE-22',
    title: 'Apache HTTP Server Path Traversal & Remote Code Execution',
    severity: 'critical',
    category: 'CVE',
    affectedTech: 'Apache httpd 2.4.49',
    summary: 'A flaw was found in a change made to path normalization in Apache HTTP Server 2.4.49. An attacker could use a path traversal attack to map URLs to files outside the directories configured by Alias-like directives. If CGI is enabled, code execution is possible.',
    remediation: 'Update to Apache HTTP Server version 2.4.50 or 2.4.51. Alternatively, ensure path normalization controls are explicitly enforced.',
    cvssScore: 9.8,
    source: 'NVD / Mitre Security Intelligence',
    updatedDate: '2026-08-15'
  },
  {
    id: 'kn-2',
    cweId: 'CWE-200',
    title: 'Spring Boot Actuator Insecure Management Endpoints Exposure',
    severity: 'high',
    category: 'OWASP',
    affectedTech: 'Spring Boot 2.x Framework',
    summary: 'Spring Boot Actuator endpoints provide monitoring and management of production applications. Exposing endpoints such as /actuator/env or /actuator/heapdump without authentication exposes secrets, environment tokens, and database connection strings.',
    remediation: 'Configure management.endpoints.web.exposure.include=health in application.properties and require admin role security filter.',
    cvssScore: 8.2,
    source: 'OWASP API Security Top 10',
    updatedDate: '2026-08-20'
  },
  {
    id: 'kn-3',
    cweId: 'CWE-78',
    title: 'Command Injection via Unsanitized Input Parameters',
    severity: 'critical',
    category: 'CWE',
    affectedTech: 'Web Applications & API Gateways',
    summary: 'The software constructs all or part of an OS command using externally-influenced input from an upstream component, but it does not neutralize or incorrectly neutralizes special elements that could modify the intended OS command.',
    remediation: 'Avoid system execution calls (exec, system, popen). Use parameterized API calls with strict input whitelisting.',
    cvssScore: 9.6,
    source: 'CWE International Corpus',
    updatedDate: '2026-09-01'
  },
  {
    id: 'kn-4',
    title: 'MITRE ATT&CK T1059.004 - Command and Scripting Interpreter: Unix Shell',
    severity: 'high',
    category: 'MITRE ATT&CK',
    affectedTech: 'Linux / Unix Systems',
    summary: 'Adversaries may abuse Unix shell commands and scripting languages (bash, sh, zsh) for execution to interact with host systems, download malicious payloads, or manipulate local configurations.',
    remediation: 'Deploy Endpoint Detection and Response (EDR) agents to monitor process execution lineages originating from web server accounts (www-data, apache, nginx).',
    source: 'MITRE ATT&CK Knowledge Base',
    updatedDate: '2026-09-04'
  }
];

export const INITIAL_AGENTS: AgentProfile[] = [
  {
    id: 'ag-supervisor',
    name: 'Supervisor Agent',
    type: 'supervisor',
    purpose: 'Coordinates overall multi-agent orchestration, maintains workflow state, and assigns security goals.',
    status: 'Ready',
    tools: ['Workflow Planner', 'State Manager', 'Task Evaluator'],
    lastActivity: '2 mins ago',
    executionsCount: 142,
    iconName: 'ShieldAlert'
  },
  {
    id: 'ag-planner',
    name: 'Planner Agent',
    type: 'planner',
    purpose: 'Deconstructs objective into scoped execution strategies and safety constraints.',
    status: 'Ready',
    tools: ['Scope Validator', 'Strategy Graph', 'Constraint Checker'],
    lastActivity: '5 mins ago',
    executionsCount: 98,
    iconName: 'Compass'
  },
  {
    id: 'ag-recon',
    name: 'Recon Agent',
    type: 'recon',
    purpose: 'Performs non-invasive DNS analysis, SSL inspection, HTTP header enumeration, and OSINT fingerprinting.',
    status: 'Ready',
    tools: ['DNS Lookup', 'SSL Inspector', 'HTTP Fingerprint', 'WHOIS'],
    lastActivity: '12 mins ago',
    executionsCount: 310,
    iconName: 'Radar'
  },
  {
    id: 'ag-scanning',
    name: 'Scanning Agent',
    type: 'scanning',
    purpose: 'Executes authorized port service discovery, banner grabbing, and protocol analysis.',
    status: 'Ready',
    tools: ['Nmap Engine', 'Banner Grabber', 'Service Classifier'],
    lastActivity: '12 mins ago',
    executionsCount: 245,
    iconName: 'Scan'
  },
  {
    id: 'ag-vulnerability',
    name: 'Vulnerability Agent',
    type: 'vulnerability',
    purpose: 'Correlates discovered services with CVE databases, exploit advisors, and version advisories.',
    status: 'Ready',
    tools: ['CVE Lookup', 'Vuln DB Correlator', 'Version Checker'],
    lastActivity: '8 mins ago',
    executionsCount: 189,
    iconName: 'Bug'
  },
  {
    id: 'ag-research',
    name: 'Research Agent',
    type: 'research',
    purpose: 'Retrieves security research papers, vendor documentation, and threat intelligence references.',
    status: 'Ready',
    tools: ['MITRE ATT&CK', 'OWASP Engine', 'Security Intel Search'],
    lastActivity: '15 mins ago',
    executionsCount: 120,
    iconName: 'BookOpen'
  },
  {
    id: 'ag-risk',
    name: 'Risk Agent',
    type: 'risk',
    purpose: 'Calculates contextual CVSS score weights, business impact, and prioritizes remediation efforts.',
    status: 'Ready',
    tools: ['CVSS Calculator', 'Impact Evaluator', 'Priority Matrix'],
    lastActivity: '20 mins ago',
    executionsCount: 165,
    iconName: 'Activity'
  },
  {
    id: 'ag-critic',
    name: 'Critic Agent',
    type: 'critic',
    purpose: 'Validates evidence rigor, detects potential false positives, and verifies findings confidence levels.',
    status: 'Ready',
    tools: ['False Positive Filter', 'Rigor Verifier', 'Confidence Scorer'],
    lastActivity: '30 mins ago',
    executionsCount: 140,
    iconName: 'CheckCircle2'
  },
  {
    id: 'ag-report',
    name: 'Report Agent',
    type: 'report',
    purpose: 'Compiles technical findings into executive summaries, timeline graphs, and downloadable security reports.',
    status: 'Ready',
    tools: ['Markdown Renderer', 'PDF Generator', 'Executive Summarizer'],
    lastActivity: '45 mins ago',
    executionsCount: 95,
    iconName: 'FileText'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Welcome to **CyberAgents**. I am your Agentic AI Security Copilot. I coordinate specialized AI security agents to assess targets, analyze findings, and secure your environment.\n\nHow can I help secure your environment today?",
    timestamp: '14:30',
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'Analyze my authorized lab target (10.10.14.5) and identify the most important security risks.',
    timestamp: '14:31',
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: "I'll investigate the target systematically. I will map the attack surface, identify exposed services, correlate findings with security intelligence, and prioritize verified risks for remediation.\n\n### Executive Summary of Investigation\nDuring our automated multi-agent run on target `10.10.14.5` (Authorized Lab Environment), CyberAgents identified **5 active services**, leading to **1 Critical RCE vulnerability** and **1 High severity credential exposure**.",
    timestamp: '14:32',
    agentActivity: {
      id: 'act-1',
      title: 'Agent Activity',
      isExpanded: true,
      steps: [
        { id: 's1', agentName: 'Planner', agentType: 'planner', status: 'completed', duration: '1.2s', summary: 'Created assessment strategy & scope parameters' },
        { id: 's2', agentName: 'Recon Agent', agentType: 'recon', status: 'completed', duration: '4.8s', summary: 'Analyzed DNS, SSL certificates, and HTTP response headers' },
        { id: 's3', agentName: 'Scanning Agent', agentType: 'scanning', status: 'completed', duration: '8.3s', summary: 'Identified 5 open network services on target 10.10.14.5' },
        { id: 's4', agentName: 'Vulnerability Agent', agentType: 'vulnerability', status: 'completed', duration: '5.1s', summary: 'Correlated Apache httpd 2.4.49 with CVE-2021-41773' },
        { id: 's5', agentName: 'Risk Agent', agentType: 'risk', status: 'completed', duration: '2.4s', summary: 'Assessed composite risk score at 8.4 / 10 (High Severity)' },
        { id: 's6', agentName: 'Report Agent', agentType: 'report', status: 'completed', duration: '1.9s', summary: 'Generated structured findings and remediation recommendations' }
      ]
    },
    findings: [INITIAL_FINDINGS[0], INITIAL_FINDINGS[1]],
    references: [
      'CVE-2021-41773 - Apache HTTP Server Path Traversal',
      'OWASP API Security Top 10 - Insecure Management Endpoints'
    ]
  }
];

export const INITIAL_APPROVAL_REQUEST: HumanApproval = {
  id: 'appr-1',
  agentName: 'Scanning Agent',
  action: 'Perform Authorized Service Discovery & Port Audit',
  target: '10.10.14.5 (Authorized Lab Target)',
  reason: 'Additional service version verification is required to confirm CVE exposure.',
  expectedOutcome: 'Non-destructive TCP SYN banner negotiation on ports 80, 443, 8080, 22, 5432.',
  timestamp: '14:33',
  status: 'pending'
};
