from backend.schemas.cyber import (
    AssessmentSchema, FindingSchema, ReportSchema, KnowledgeItemSchema, AgentProfileSchema, MessageSchema
)

INITIAL_ASSESSMENTS = [
    AssessmentSchema(
        id='asm-1',
        title='Lab Web Assessment',
        target='Authorized Lab Environment',
        targetIp='10.10.14.5 / web-lab.internal',
        environment='Lab',
        status='in_progress',
        riskScore=8.4,
        progressPhases={
            'recon': True,
            'serviceAnalysis': True,
            'vulnerabilityResearch': 'in_progress',
            'riskAssessment': False,
            'report': False,
        },
        openServices=[
            {'port': 80, 'service': 'http', 'version': 'Apache httpd 2.4.49', 'banner': 'HTTP/1.1 200 OK Server: Apache/2.4.49'},
            {'port': 443, 'service': 'https', 'version': 'OpenSSL 1.1.1k', 'banner': 'TLSv1.3 ECDHE-RSA-AES256-GCM-SHA384'},
            {'port': 8080, 'service': 'http-proxy', 'version': 'Spring Boot 2.3.1.RELEASE', 'banner': 'JVM 11.0.11 Actuator Endpoint Exposed'},
            {'port': 22, 'service': 'ssh', 'version': 'OpenSSH 8.2p1 Ubuntu', 'banner': 'SSH-2.0-OpenSSH_8.2p1'},
            {'port': 5432, 'service': 'postgresql', 'version': 'PostgreSQL DB 13.4', 'banner': 'PostgreSQL 13.4'}
        ],
        techStack=['Apache 2.4.49', 'Spring Boot 2.3.1', 'PostgreSQL 13.4', 'Ubuntu Linux'],
        verifiedFindingsCount=4,
        createdAt='2026-09-09T14:32:00Z'
    )
]

INITIAL_FINDINGS = [
    FindingSchema(
        id='fnd-101',
        title='Path Traversal & RCE in Apache httpd (CVE-2021-41773)',
        severity='critical',
        confidence=96,
        asset='Authorized Lab Web Server (10.10.14.5)',
        targetIp='10.10.14.5:80',
        status='active',
        category='Remote Code Execution',
        evidence=[
            'GET /icons/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd HTTP/1.1 returned HTTP 200.',
            'mod_cgi enabled allowing POST payload execution via CGI script path mapping.'
        ],
        impact='Unauthenticated attacker can traverse outside document root and execute arbitrary code.',
        remediation='Immediately upgrade Apache httpd to 2.4.51 or higher.',
        cveId='CVE-2021-41773',
        cweId='CWE-22',
        firstDetected='2026-09-09T14:35:12Z',
        lastUpdated='2026-09-09T14:38:00Z',
        agentActivitySummary='Identified by Scanning Agent via HTTP banner analysis.',
        references=['https://nvd.nist.gov/vuln/detail/CVE-2021-41773']
    ),
    FindingSchema(
        id='fnd-102',
        title='Exposed Spring Boot Actuator Env Endpoint',
        severity='high',
        confidence=94,
        asset='Internal API Gateway (10.10.14.5:8080)',
        targetIp='10.10.14.5:8080',
        status='active',
        category='Information Disclosure',
        evidence=[
            'GET /actuator/env returns 200 OK with full Spring environment configuration parameters.'
        ],
        impact='Exposure of sensitive application configuration details to unauthenticated users.',
        remediation='Restrict management.endpoints.web.exposure.include to health only.',
        cveId='CWE-200',
        cweId='CWE-200',
        firstDetected='2026-09-09T14:36:04Z',
        lastUpdated='2026-09-09T14:36:04Z',
        agentActivitySummary='Discovered during Recon Agent web crawler tech stack fingerprinting.',
        references=['https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html']
    )
]

INITIAL_REPORTS = [
    ReportSchema(
        id='rep-1',
        title='Lab Web Assessment & Attack Surface Security Report',
        date='September 9, 2026',
        riskScore=8.4,
        riskLevel='High',
        findingsCount=5,
        status='Completed',
        target='Authorized Lab Environment (10.10.14.5)',
        author='CyberAgents AI Security Copilot',
        executiveSummary='CyberAgents completed an automated multi-agent security assessment of the target environment. Discovered 1 Critical RCE vulnerability (CVE-2021-41773) in Apache 2.4.49.',
        attackSurface='5 open network ports identified across HTTP (80), HTTPS (443), Spring Gateway (8080), SSH (22), and PostgreSQL (5432).',
        findingsSummary={'critical': 1, 'high': 1, 'medium': 1, 'low': 1, 'info': 1},
        remediationRoadmap=[
            'Patch Apache httpd to 2.4.51+ immediately to mitigate CVE-2021-41773.',
            'Restrict Spring Boot Actuator endpoints (/actuator/env).',
            'Inject standard OWASP security headers across web proxy.'
        ]
    )
]

INITIAL_KNOWLEDGE = [
    KnowledgeItemSchema(
        id='kn-1',
        cveId='CVE-2021-41773',
        cweId='CWE-22',
        title='Apache HTTP Server Path Traversal & Remote Code Execution',
        severity='critical',
        category='CVE',
        affectedTech='Apache httpd 2.4.49',
        summary='A flaw in path normalization in Apache HTTP Server 2.4.49 allows path traversal and remote code execution if CGI is enabled.',
        remediation='Update to Apache HTTP Server 2.4.51 or higher.',
        cvssScore=9.8,
        source='NVD / Mitre Security Intelligence',
        updatedDate='2026-08-15'
    )
]

INITIAL_AGENTS = [
    AgentProfileSchema(
        id='ag-supervisor',
        name='Supervisor Agent',
        type='supervisor',
        purpose='Coordinates overall multi-agent orchestration and maintains workflow state.',
        status='Ready',
        tools=['Workflow Planner', 'State Manager', 'Task Evaluator'],
        lastActivity='2 mins ago',
        executionsCount=142,
        iconName='ShieldAlert'
    ),
    AgentProfileSchema(
        id='ag-planner',
        name='Planner Agent',
        type='planner',
        purpose='Deconstructs objective into scoped execution strategies and safety constraints.',
        status='Ready',
        tools=['Scope Validator', 'Strategy Graph'],
        lastActivity='5 mins ago',
        executionsCount=98,
        iconName='Compass'
    ),
    AgentProfileSchema(
        id='ag-recon',
        name='Recon Agent',
        type='recon',
        purpose='Performs non-invasive DNS analysis, SSL inspection, HTTP header enumeration.',
        status='Ready',
        tools=['DNS Lookup', 'SSL Inspector', 'HTTP Fingerprint'],
        lastActivity='12 mins ago',
        executionsCount=310,
        iconName='Radar'
    ),
    AgentProfileSchema(
        id='ag-scanning',
        name='Scanning Agent',
        type='scanning',
        purpose='Executes authorized port service discovery, banner grabbing, and protocol analysis.',
        status='Ready',
        tools=['Nmap Engine', 'Banner Grabber'],
        lastActivity='12 mins ago',
        executionsCount=245,
        iconName='Scan'
    ),
    AgentProfileSchema(
        id='ag-vulnerability',
        name='Vulnerability Agent',
        type='vulnerability',
        purpose='Correlates discovered services with CVE databases and exploit advisors.',
        status='Ready',
        tools=['CVE Lookup', 'Vuln DB Correlator'],
        lastActivity='8 mins ago',
        executionsCount=189,
        iconName='Bug'
    ),
    AgentProfileSchema(
        id='ag-research',
        name='Research Agent',
        type='research',
        purpose='Retrieves security research papers, vendor documentation, and threat intelligence.',
        status='Ready',
        tools=['MITRE ATT&CK', 'OWASP Engine'],
        lastActivity='15 mins ago',
        executionsCount=120,
        iconName='BookOpen'
    ),
    AgentProfileSchema(
        id='ag-risk',
        name='Risk Agent',
        type='risk',
        purpose='Calculates contextual CVSS score weights, business impact, and prioritizes remediation.',
        status='Ready',
        tools=['CVSS Calculator', 'Impact Evaluator'],
        lastActivity='20 mins ago',
        executionsCount=165,
        iconName='Activity'
    ),
    AgentProfileSchema(
        id='ag-critic',
        name='Critic Agent',
        type='critic',
        purpose='Validates evidence rigor, detects potential false positives, and verifies findings confidence.',
        status='Ready',
        tools=['False Positive Filter', 'Rigor Verifier'],
        lastActivity='30 mins ago',
        executionsCount=140,
        iconName='CheckCircle2'
    ),
    AgentProfileSchema(
        id='ag-report',
        name='Report Agent',
        type='report',
        purpose='Compiles technical findings into executive summaries and downloadable reports.',
        status='Ready',
        tools=['Markdown Renderer', 'PDF Generator'],
        lastActivity='45 mins ago',
        executionsCount=95,
        iconName='FileText'
    )
]
