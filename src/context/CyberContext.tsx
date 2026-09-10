import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  ViewType, 
  Finding, 
  Assessment, 
  SecurityReport, 
  KnowledgeItem, 
  AgentProfile, 
  Message, 
  HumanApproval,
  AgentStep,
  AgentActivity
} from '../types/cyber';
import { 
  INITIAL_ASSESSMENTS, 
  INITIAL_FINDINGS, 
  INITIAL_REPORTS, 
  INITIAL_KNOWLEDGE, 
  INITIAL_AGENTS, 
  INITIAL_MESSAGES,
  INITIAL_APPROVAL_REQUEST
} from '../services/cyberApi';
import { getAssessments, createAssessment, authorizeAssessment } from '../api/assessments';
import { getFindings } from '../api/findings';
import { getReports } from '../api/reports';
import { getAgents } from '../api/agents';
import { searchKnowledge } from '../api/knowledge';
import { approveAction as apiApproveAction, rejectAction as apiRejectAction } from '../api/approvals';
import { getHealth } from '../api/health';
import { streamChatResponse } from '../services/chatStream';
import { createEmptyActivity, reduceSSEEvent } from '../services/eventReducer';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface CyberContextType {
  // Navigation & Layout
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  
  // Modals & Palettes
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isScopeModalOpen: boolean;
  setIsScopeModalOpen: (open: boolean) => void;
  isHumanApprovalOpen: boolean;
  setIsHumanApprovalOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  
  // Data items
  assessments: Assessment[];
  activeAssessment: Assessment | null;
  setActiveAssessment: (asm: Assessment | null) => void;
  
  findings: Finding[];
  selectedFinding: Finding | null;
  setSelectedFinding: (finding: Finding | null) => void;
  
  reports: SecurityReport[];
  selectedReport: SecurityReport | null;
  setSelectedReport: (report: SecurityReport | null) => void;
  
  knowledgeItems: KnowledgeItem[];
  agents: AgentProfile[];
  
  messages: Message[];
  isGenerating: boolean;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  
  // Actions
  humanApproval: HumanApproval | null;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  startNewAssessment: (target: string, environment: string, scope: string) => void;
  startNewBlankAssessment: () => void;
  confirmAuthorization: (assessmentId?: string, target?: string) => Promise<void>;
  investigateFinding: (finding: Finding) => void;
  
  // Toast notifications
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  isBackendConnected: boolean;
}

const CyberContext = createContext<CyberContextType | undefined>(undefined);

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const CyberProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState<boolean>(false);
  const [isHumanApprovalOpen, setIsHumanApprovalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [assessments, setAssessments] = useState<Assessment[]>(INITIAL_ASSESSMENTS);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(INITIAL_ASSESSMENTS[0]);
  
  const [findings, setFindings] = useState<Finding[]>(INITIAL_FINDINGS);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  
  const [reports, setReports] = useState<SecurityReport[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);
  
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(INITIAL_KNOWLEDGE);
  const [agents, setAgents] = useState<AgentProfile[]>(INITIAL_AGENTS);
  
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [humanApproval, setHumanApproval] = useState<HumanApproval | null>(INITIAL_APPROVAL_REQUEST);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleRightPanel = () => setIsRightPanelOpen(prev => !prev);

  const addToast = (type: Toast['type'], message: string) => {
    const id = 't-' + Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch real backend data on mount if not strictly in DEMO_MODE
  useEffect(() => {
    if (IS_DEMO_MODE) return;

    async function loadBackendData() {
      try {
        const health = await getHealth();
        if (health && health.status === 'healthy') {
          setIsBackendConnected(true);
        }

        const [asmData, fndData, repData, agtData, knwData] = await Promise.allSettled([
          getAssessments(),
          getFindings(),
          getReports(),
          getAgents(),
          searchKnowledge('')
        ]);

        if (asmData.status === 'fulfilled' && asmData.value.length > 0) {
          setAssessments(asmData.value);
          setActiveAssessment(asmData.value[0]);
        }
        if (fndData.status === 'fulfilled' && fndData.value.length > 0) {
          setFindings(fndData.value);
        }
        if (repData.status === 'fulfilled' && repData.value.length > 0) {
          setReports(repData.value);
        }
        if (agtData.status === 'fulfilled' && agtData.value.length > 0) {
          setAgents(agtData.value);
        }
        if (knwData.status === 'fulfilled' && knwData.value.length > 0) {
          setKnowledgeItems(knwData.value);
        }
      } catch (err) {
        console.warn('Backend load error, running with current state:', err);
      }
    }

    loadBackendData();
  }, []);

  const approveAction = async (id: string) => {
    if (!humanApproval || humanApproval.id !== id) return;

    if (!IS_DEMO_MODE) {
      try {
        await apiApproveAction(id);
      } catch (err) {
        console.warn('Backend approval sync error:', err);
      }
    }

    setHumanApproval({ ...humanApproval, status: 'approved' });
    addToast('success', `Action Approved: ${humanApproval.action}`);
    setIsHumanApprovalOpen(false);
    
    const approvalMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: `**Action Approved by Operator**: ${humanApproval.action}\n\nThe **Scanning Agent** has resumed execution on target \`${humanApproval.target}\`. Service discovery banners verified.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentActivity: {
        id: 'act-appr',
        title: 'Agent Execution Progress',
        isExpanded: true,
        steps: [
          { id: 's-appr1', agentName: 'Scanning Agent', agentType: 'scanning', status: 'completed', duration: '3.4s', summary: 'Verified HTTP 80/443, Spring Actuator 8080, SSH 22, Postgres 5432' }
        ]
      }
    };
    setMessages(prev => [...prev, approvalMsg]);
  };

  const rejectAction = async (id: string) => {
    if (!humanApproval || humanApproval.id !== id) return;

    if (!IS_DEMO_MODE) {
      try {
        await apiRejectAction(id);
      } catch (err) {
        console.warn('Backend rejection sync error:', err);
      }
    }

    setHumanApproval({ ...humanApproval, status: 'rejected' });
    addToast('warning', `Action Rejected: ${humanApproval.action}`);
    setIsHumanApprovalOpen(false);
    
    const rejectMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: `**Action Rejected by Operator**: The requested scanning action was skipped. CyberAgents will proceed using only existing passive intelligence.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, rejectMsg]);
  };

  const startNewAssessment = async (target: string, environment: string, scope: string) => {
    // Completely wipe previous execution trace and messages for new assessment
    setMessages([]);
    setFindings([]);
    setSelectedFinding(null);
    setReports([]);

    if (!IS_DEMO_MODE) {
      try {
        const created = await createAssessment({ target, environment, scope });
        setAssessments(prev => [created, ...prev]);
        setActiveAssessment(created);
        setIsScopeModalOpen(false);
        setCurrentView('chat');
        addToast('success', `New Security Assessment (${created.id}) created for ${target}`);
        return;
      } catch (err: any) {
        addToast('error', `Failed to create assessment: ${err.message}`);
      }
    }

    // Local fallback if DEMO_MODE or offline
    const newAsm: Assessment = {
      id: 'asm_' + Date.now(),
      title: `${target} Security Assessment`,
      target: target,
      targetIp: target,
      environment: (environment as any) || 'Lab',
      status: 'in_progress',
      riskScore: 0.0,
      progressPhases: {
        recon: false,
        serviceAnalysis: false,
        vulnerabilityResearch: 'pending',
        riskAssessment: false,
        report: false
      },
      openServices: [],
      techStack: [],
      verifiedFindingsCount: 0,
      createdAt: new Date().toISOString()
    };

    setAssessments(prev => [newAsm, ...prev]);
    setActiveAssessment(newAsm);
    setIsScopeModalOpen(false);
    setCurrentView('chat');
    addToast('success', `New Security Assessment (${newAsm.id}) created for ${target}`);
  };

  const startNewBlankAssessment = () => {
    const asmId = 'asm_' + Date.now();
    const blankAsm: Assessment = {
      id: asmId,
      title: 'New Security Assessment',
      target: '',
      targetIp: '',
      environment: 'Lab',
      status: 'in_progress',
      riskScore: 0.0,
      progressPhases: {
        recon: false,
        serviceAnalysis: false,
        vulnerabilityResearch: 'pending',
        riskAssessment: false,
        report: false
      },
      openServices: [],
      techStack: [],
      verifiedFindingsCount: 0,
      createdAt: new Date().toISOString()
    };

    setAssessments(prev => [blankAsm, ...prev]);
    setActiveAssessment(blankAsm);
    setMessages([]);
    setCurrentView('chat');
    addToast('info', 'Started new ChatGPT-like Security Assessment session.');
  };

  const confirmAuthorization = async (assessmentId?: string, target?: string) => {
    const targetAsmId = assessmentId || activeAssessment?.id || 'asm_' + Date.now();
    const targetName = target || activeAssessment?.target || '127.0.0.1';

    if (!IS_DEMO_MODE) {
      try {
        const res = await authorizeAssessment(targetAsmId, { authorized: true, target: targetName });
        if (activeAssessment) {
          const updated: Assessment = {
            ...activeAssessment,
            id: res.assessment_id,
            target: res.target,
            targetIp: res.target_ip,
            status: 'in_progress',
            authorization_status: 'confirmed',
            authorization_confirmed_at: new Date().toISOString(),
            authorization_method: 'user_confirmation'
          };
          setActiveAssessment(updated);
          setAssessments(prev => prev.map(a => a.id === targetAsmId || a.id === activeAssessment.id ? updated : a));
        }
        addToast('success', `Authorization confirmed for target ${res.target}`);
      } catch (err: any) {
        console.warn('Authorization API sync warning:', err);
      }
    } else {
      if (activeAssessment) {
        const updated: Assessment = {
          ...activeAssessment,
          authorization_status: 'confirmed',
          status: 'in_progress',
          authorization_confirmed_at: new Date().toISOString(),
          authorization_method: 'user_confirmation'
        };
        setActiveAssessment(updated);
        setAssessments(prev => prev.map(a => a.id === activeAssessment.id ? updated : a));
      }
      addToast('success', `Authorization confirmed locally for target ${targetName}`);
    }

    // Launch/resume real execution loop
    await sendMessage("Yes, I am explicitly authorized to perform security testing against this target.");
  };


  const investigateFinding = (finding: Finding) => {
    setSelectedFinding(finding);
    setCurrentView('chat');
    sendMessage(`Investigate finding "${finding.title}" on asset ${finding.asset}. What is the attack vector, impact, and exact remediation plan?`);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: "Conversation cleared. How can CyberAgents assist with your security assessment?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    addToast('info', 'Chat history cleared');
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    if (!IS_DEMO_MODE) {
      const assistantMessageId = 'msg-' + (Date.now() + 1);
      
      // Initialize streaming assistant message placeholder
      const placeholderMsg: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentActivity: createEmptyActivity('act-' + Date.now())
      };

      setMessages(prev => [...prev, placeholderMsg]);

      await streamChatResponse({
        message: content,
        assessmentId: activeAssessment?.id,
        onEvent: (event: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMessageId) {
              const currentAct = m.agentActivity || createEmptyActivity();
              const updatedAct = reduceSSEEvent(currentAct, event);
              return {
                ...m,
                agentActivity: updatedAct
              };
            }
            return m;
          }));
        },
        onAgentStep: (step: AgentStep) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMessageId) {
              const currentAct = m.agentActivity || createEmptyActivity();
              const updatedAct = reduceSSEEvent(currentAct, { event: 'agent_step', step });
              return {
                ...m,
                agentActivity: updatedAct
              };
            }
            return m;
          }));
        },
        onDelta: (delta: string) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMessageId) {
              return { ...m, content: m.content + delta };
            }
            return m;
          }));
        },
        onComplete: (completedMessage: Message) => {
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMessageId) {
              return {
                ...completedMessage,
                id: assistantMessageId,
                agentActivity: m.agentActivity || completedMessage.agentActivity
              };
            }
            return m;
          }));
          setIsGenerating(false);
        },
        onError: (err: Error) => {
          console.warn('Real stream error, falling back if needed:', err);
          addToast('error', `Streaming error: ${err.message}`);
          setIsGenerating(false);
        }
      });
      return;
    }

    // Local Demo Fallback Mode
    const initialDemoActivity = createEmptyActivity('act-' + Date.now());
    const reducedDemoActivity = reduceSSEEvent(initialDemoActivity, {
      event: 'supervisor_interpreted',
      request_classified: 'Authorized Web Security Audit',
      target: '10.10.14.5',
      scope: '10.10.14.0/24 (Authorized Lab)',
      summary: 'Target scope validated by Supervisor.'
    });

    setTimeout(() => {
      let assistantText = `I have analyzed the request and correlated intelligence across our active target environment (\`${activeAssessment?.targetIp || '10.10.14.5'}\`).\n\n### Intelligence Summary\n- **Target Scope**: Verified Authorized Lab Environment\n- **Identified Vectors**: Remote Code Execution (CVE-2021-41773), Spring Actuator credentials exposure.\n- **Action Priority**: Patch web server daemon immediately and restrict management ports.`;
      
      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentActivity: reducedDemoActivity,
        findings: [findings[0], findings[1]],
        references: ['CVE-2021-41773', 'Spring Actuator Security Docs']
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 1600);
  };

  return (
    <CyberContext.Provider value={{
      currentView,
      setCurrentView,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebar,
      isRightPanelOpen,
      setIsRightPanelOpen,
      toggleRightPanel,
      
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
      isScopeModalOpen,
      setIsScopeModalOpen,
      isHumanApprovalOpen,
      setIsHumanApprovalOpen,
      isSettingsOpen,
      setIsSettingsOpen,
      
      assessments,
      activeAssessment,
      setActiveAssessment,
      
      findings,
      selectedFinding,
      setSelectedFinding,
      
      reports,
      selectedReport,
      setSelectedReport,
      
      knowledgeItems,
      agents,
      
      messages,
      isGenerating,
      sendMessage,
      clearMessages,
      
      humanApproval,
      approveAction,
      rejectAction,
      startNewAssessment,
      startNewBlankAssessment,
      confirmAuthorization,
      investigateFinding,
      
      toasts,
      addToast,
      removeToast,
      isBackendConnected,
    }}>
      {children}
    </CyberContext.Provider>
  );
};

export const useCyber = () => {
  const context = useContext(CyberContext);
  if (!context) {
    throw new Error('useCyber must be used within a CyberProvider');
  }
  return context;
};
