import uuid
import datetime
from typing import Dict, List, Optional, Any
from backend.schemas.cyber import AssessmentSchema, FindingSchema

class BackendStore:
    def __init__(self):
        self.assessments: Dict[str, AssessmentSchema] = {}
        self.findings: Dict[str, List[FindingSchema]] = {} # assessment_id -> list of findings
        self.executions: Dict[str, Any] = {}
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}

        # Default lab assessment
        default_asm = AssessmentSchema(
            id="asm-1",
            title="Target Lab Assessment",
            target="target.lab",
            targetIp="127.0.0.1",
            scope="target.lab",
            environment="Lab",
            status="in_progress",
            riskScore=8.4,
            progressPhases={
                "recon": True,
                "serviceAnalysis": True,
                "vulnerabilityResearch": "in_progress",
                "riskAssessment": False,
                "report": False
            },
            openServices=[
                {"port": 80, "service": "http", "version": "Apache/2.4.41", "banner": "Apache/2.4.41 (Unix)"}
            ],
            techStack=["Apache", "PHP"],
            verifiedFindingsCount=1,
            createdAt=datetime.datetime.utcnow().isoformat() + "Z"
        )
        self.assessments["asm-1"] = default_asm

        default_finding = FindingSchema(
            id="fnd-1",
            title="Apache Path Traversal (CVE-2021-41773)",
            severity="critical",
            confidence=95,
            asset="target.lab:80",
            targetIp="127.0.0.1:80",
            status="active",
            category="Path Traversal",
            evidence=["HTTP 200 response received for /cgi-bin/.%2e/.%2e/.%2e/.%2e/etc/passwd"],
            impact="Arbitrary file read on host filesystem.",
            remediation="Upgrade Apache HTTP Server to 2.4.51 or higher.",
            cveId="CVE-2021-41773",
            firstDetected=datetime.datetime.utcnow().isoformat() + "Z",
            lastUpdated=datetime.datetime.utcnow().isoformat() + "Z"
        )
        self.findings["asm-1"] = [default_finding]


    def create_assessment(self, target: Optional[str] = None, environment: str = "Lab", scope: Optional[str] = None, assessment_id: Optional[str] = None) -> AssessmentSchema:
        from backend.utils.target_normalizer import target_normalizer
        asm_id = assessment_id or f"asm_{uuid.uuid4().hex[:8]}"
        
        targets_list = []
        target_ip = None
        auth_status = "unconfirmed"
        auth_confirmed_at = None
        auth_method = None

        if target:
            norm = target_normalizer.normalize(target)
            canonical_target = norm["hostname"]
            targets_list = [canonical_target]
            target_ip = norm["ip"]
            title = f"{canonical_target} Security Assessment"
            auth_status = "confirmed"
            auth_confirmed_at = datetime.datetime.utcnow().isoformat() + "Z"
            auth_method = "user_confirmation"
        else:
            title = "New Security Assessment"
            canonical_target = None

        asm = AssessmentSchema(
            id=asm_id,
            title=title,
            target=canonical_target,
            targetIp=target_ip,
            targets=targets_list,
            excluded_targets=[],
            scope=scope or (",".join(targets_list) if targets_list else None),
            environment=environment,
            status="in_progress" if auth_status == "confirmed" else "awaiting_target",
            authorization_status=auth_status,
            authorization_confirmed_at=auth_confirmed_at,
            authorization_method=auth_method,
            riskScore=0.0,
            progressPhases={
                "recon": False,
                "serviceAnalysis": False,
                "vulnerabilityResearch": False,
                "riskAssessment": False,
                "report": False
            },
            openServices=[],
            techStack=[],
            verifiedFindingsCount=0,
            createdAt=datetime.datetime.utcnow().isoformat() + "Z"
        )
        self.assessments[asm_id] = asm
        self.findings[asm_id] = []
        return asm


    def get_assessment(self, asm_id: str) -> Optional[AssessmentSchema]:
        return self.assessments.get(asm_id)

    def list_assessments(self) -> List[AssessmentSchema]:
        return list(self.assessments.values())

    def get_findings_for_assessment(self, asm_id: str) -> List[FindingSchema]:
        return self.findings.get(asm_id, [])

    def add_finding(self, asm_id: str, finding: FindingSchema):
        if asm_id not in self.findings:
            self.findings[asm_id] = []
        self.findings[asm_id].append(finding)
        if asm_id in self.assessments:
            self.assessments[asm_id].verifiedFindingsCount = len(self.findings[asm_id])

store = BackendStore()
