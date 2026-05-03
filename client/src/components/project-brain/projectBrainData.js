// Static configuration data for Project Brain Dashboard
export const projectBrainData = {
  header: {
    title: "ZYMI/QiBo Project Brain Dashboard",
    subtitle: "Advanced Project Health & System Monitoring",
    warning: "Admin-only access. Real-time core locked for safety.",
    lastUpdated: new Date().toLocaleString()
  },
  healthCards: {
    server: {
      status: "healthy",
      uptime: "24h 15m 30s",
      icon: "🖥️",
      label: "Server Status"
    },
    database: {
      status: "healthy",
      connections: 15,
      icon: "🗄️",
      label: "Database Status"
    },
    socket: {
      status: "active",
      connections: 8,
      icon: "🔌",
      label: "Socket Status"
    },
    webrtc: {
      status: "ready",
      activeCalls: 2,
      icon: "📹",
      label: "WebRTC Status"
    },
    adminSystem: {
      status: "operational",
      icon: "👑",
      label: "Admin System"
    },
    designSystem: {
      status: "locked",
      icon: "🎨",
      label: "Design System"
    }
  },
  realTimeCoreStatus: {
    title: "Real-Time Core Map",
    components: [
      {
        name: "server/index.js",
        role: "Server Brain",
        status: "active",
        description: "Node.js server with Express, Socket.IO, and API endpoints"
      },
      {
        name: "SocketContext.jsx",
        role: "Connection Hub",
        status: "active",
        description: "React context for socket connections and event handling"
      },
      {
        name: "Dashboard.jsx",
        role: "Engine + UI",
        status: "active",
        description: "Main chat interface, call management, and real-time updates"
      },
      {
        name: "Socket.IO",
        role: "Signaling",
        status: "active",
        description: "Real-time bidirectional communication protocol"
      },
      {
        name: "WebRTC",
        role: "Peer Media",
        status: "ready",
        description: "Browser-based peer-to-peer audio/video streaming"
      }
    ]
  },
  structureLockStatus: {
    title: "Structure Lock Status",
    locks: [
      {
        category: "Socket Events",
        items: ["join", "private-message", "call-user", "incoming-call", "make-answer", "call-answer", "ice-candidate", "end-call"],
        status: "locked",
        icon: "🔒"
      },
      {
        category: "WebRTC Flow",
        items: ["getUserMedia → create RTCPeerConnection → createOffer → call-user → incoming-call → make-answer → call-answer → ICE exchange → ontrack → cleanup"],
        status: "locked",
        icon: "🔒"
      },
      {
        category: "Route Hierarchy",
        items: ["/exclusivesecure/* admin routes", "/login user login", "/ dashboard"],
        status: "locked",
        icon: "🔒"
      },
      {
        category: "Component Hierarchy",
        items: ["App.jsx → Dashboard/SocketProvider", "AdminPanel.jsx → sub-tabs", "SocketContext → all components"],
        status: "locked",
        icon: "🔒"
      },
      {
        category: "Design Tokens",
        items: ["colors (--neon-primary, --neon-secondary)", "spacing (--radius-*)", "typography (font-family)", "shadows (--shadow-*)"],
        status: "locked",
        icon: "🔒"
      },
      {
        category: "Responsive Rules",
        items: ["Mobile: 1 column, 44px touch targets", "Tablet: 2 columns", "Desktop: 2-3 columns, no overflow"],
        status: "locked",
        icon: "🔒"
      }
    ]
  },
  riskDetectionBoard: {
    title: "Risk Detection Board",
    risks: [
      {
        type: "critical",
        title: "Event Name Changes",
        description: "Modifying socket event names like 'join' or 'call-user' breaks real-time communication",
        impact: "Complete chat/call failure",
        mitigation: "Keep event names locked in SocketContext.jsx"
      },
      {
        type: "high",
        title: "ID Mismatch Risk",
        description: "Changing user ID generation or validation breaks peer connections",
        impact: "WebRTC calls fail to connect",
        mitigation: "Maintain existing ID format in Dashboard.jsx"
      },
      {
        type: "high",
        title: "ICE Candidate Break",
        description: "Altering ICE candidate handling prevents NAT traversal",
        impact: "Calls cannot establish peer-to-peer connection",
        mitigation: "Preserve RTCPeerConnection logic"
      },
      {
        type: "medium",
        title: "Database Migration Risk",
        description: "New DB tables or schema changes without testing",
        impact: "Data corruption or app crashes",
        mitigation: "No new tables in this phase"
      },
      {
        type: "medium",
        title: "Responsive Break Risk",
        description: "CSS changes breaking mobile/tablet layouts",
        impact: "Poor UX on devices",
        mitigation: "Use existing tokens and test all breakpoints"
      },
      {
        type: "critical",
        title: "Multi-Node Socket Scaling Risk",
        description: "userSockets Map is in-memory only, cannot scale beyond single node",
        impact: "Messages/calls fail when users are on different servers",
        mitigation: "Single-node deployment only, Redis registry required for scaling"
      },
      {
        type: "low",
        title: "Design Token Violation",
        description: "Adding custom colors/styles instead of tokens",
        impact: "Inconsistent UI",
        mitigation: "Use only existing --neon-*, --bg-*, --text-*, --radius-*, --shadow-* variables"
      }
    ]
  },
  completedPendingTracker: {
    title: "Feature Progress Tracker",
    items: [
      {
        feature: "Socket.IO Integration",
        status: "completed",
        description: "Real-time bidirectional communication established"
      },
      {
        feature: "WebRTC Audio/Video Calls",
        status: "completed",
        description: "Peer-to-peer media streaming implemented"
      },
      {
        feature: "P2P Media Transfer",
        status: "completed",
        description: "Server-less media sharing via DataChannels"
      },
      {
        feature: "Coturn TURN Relay",
        status: "completed",
        description: "Self-hosted fallback for WebRTC connectivity"
      },
      {
        feature: "Production Observability",
        status: "in-progress",
        description: "Real TURN health, usage tracking, and cost guard"
      },
      {
        feature: "User Authentication",
        status: "completed",
        description: "Login/logout and admin access control"
      },
      {
        feature: "Admin Dashboard",
        status: "completed",
        description: "User management and system monitoring"
      },
      {
        feature: "Message Encryption",
        status: "in-progress",
        description: "End-to-end encryption for private messages"
      },
      {
        feature: "File Sharing",
        status: "pending",
        description: "Secure file upload and download"
      },
      {
        feature: "Push Notifications",
        status: "pending",
        description: "Browser push notifications for new messages"
      },
      {
        feature: "Dark Mode Toggle",
        status: "pending",
        description: "User preference for theme switching"
      },
      {
        feature: "Voice Messages",
        status: "pending",
        description: "Record and send voice messages"
      },
      {
        feature: "Group Calls",
        status: "verify-required",
        description: "Multi-user video conference calls"
      },
      {
        feature: "Message Reactions",
        status: "verify-required",
        description: "Emoji reactions to messages"
      }
    ]
  },
  socketEventMapViewer: {
    title: "Socket Event Map",
    clientEmits: [
      { event: "join", description: "User joins a room/channel" },
      { event: "private-message", description: "Send private message to another user" },
      { event: "typing", description: "Indicate user is typing" },
      { event: "stop-typing", description: "Stop typing indicator" },
      { event: "call-user", description: "Initiate call to another user" },
      { event: "make-answer", description: "Send call answer to caller" },
      { event: "ice-candidate", description: "Share ICE candidate for connection" },
      { event: "end-call", description: "Terminate active call" },
      { event: "reject-call", description: "Reject incoming call request" }
    ],
    serverEmits: [
      { event: "new-message", description: "New message received" },
      { event: "user-typing", description: "Another user started typing" },
      { event: "user-stop-typing", description: "Another user stopped typing" },
      { event: "user-online", description: "User came online" },
      { event: "user-offline", description: "User went offline" },
      { event: "incoming-call", description: "Incoming call request" },
      { event: "call-answer", description: "Call answer received" },
      { event: "call-ended", description: "Call terminated" },
      { event: "call-rejected", description: "Call rejected" },
      { event: "ice-candidate", description: "ICE candidate received" },
      { event: "banned", description: "User banned notification" }
    ]
  },
  webrtcFlowGuard: {
    title: "WebRTC Flow Guard",
    steps: [
      { step: "getUserMedia", description: "Request access to camera/microphone", status: "locked" },
      { step: "RTCPeerConnection", description: "Create peer connection object", status: "locked" },
      { step: "createOffer", description: "Generate SDP offer", status: "locked" },
      { step: "call-user", description: "Send offer via socket", status: "locked" },
      { step: "incoming-call", description: "Receive call request", status: "locked" },
      { step: "make-answer", description: "Generate SDP answer", status: "locked" },
      { step: "call-answer", description: "Send answer via socket", status: "locked" },
      { step: "ICE exchange", description: "Exchange ICE candidates", status: "locked" },
      { step: "ontrack", description: "Handle remote media streams", status: "locked" },
      { step: "cleanup", description: "Close connections and cleanup", status: "locked" }
    ]
  },
  routeMapVisualizer: {
    title: "Route Map Visualizer",
    publicRoutes: [
      { path: "/", description: "Main application entry" }
    ],
    protectedUserRoutes: [
      { path: "/dashboard", description: "User chat interface" },
      { path: "/settings", description: "User settings page" },
      { path: "/profile", description: "User profile management" },
      { path: "/calls", description: "Call history and management" }
    ],
    adminSecureRoutes: [
      { path: "/exclusivesecure", description: "Admin dashboard" },
      { path: "/exclusivesecure/users", description: "User management" },
      { path: "/exclusivesecure/audit", description: "Audit logs" },
      { path: "/exclusivesecure/risks", description: "Risk monitoring" },
      { path: "/exclusivesecure/settings", description: "Admin settings" },
      { path: "/exclusivesecure/structure-lock", description: "System locks" },
      { path: "/exclusivesecure/reports", description: "Message reports" },
      { path: "/exclusivesecure/qa", description: "QA testing gate" },
      { path: "/exclusivesecure/project-brain", description: "Project brain dashboard" }
    ],
    apiRoutes: [
      { path: "/api/auth/*", description: "Authentication endpoints" },
      { path: "/api/admin/*", description: "Admin API endpoints" },
      { path: "/api/users/*", description: "User management APIs" }
    ],
    socketNamespace: [
      { namespace: "/", description: "Main socket namespace for chat and calls" }
    ]
  },
  designTokenInspector: {
    title: "Design Token Inspector",
    categories: [
      {
        name: "Colors",
        tokens: [
          { token: "--neon-primary", value: "#06b6d4", description: "Primary accent color" },
          { token: "--neon-secondary", value: "#8b5cf6", description: "Secondary accent color" },
          { token: "--neon-success", value: "#10b981", description: "Success state color" },
          { token: "--neon-danger", value: "#ef4444", description: "Error/danger color" },
          { token: "--neon-warning", value: "#f59e0b", description: "Warning color" },
          { token: "--bg-primary", value: "#0f172a", description: "Primary background" },
          { token: "--bg-secondary", value: "#1e293b", description: "Secondary background" },
          { token: "--bg-tertiary", value: "#334155", description: "Tertiary background" },
          { token: "--text-primary", value: "#f1f5f9", description: "Primary text color" },
          { token: "--text-secondary", value: "#94a3b8", description: "Secondary text" },
          { token: "--text-muted", value: "#64748b", description: "Muted text" }
        ]
      },
      {
        name: "Spacing",
        tokens: [
          { token: "padding", value: "20px", description: "Card padding" },
          { token: "margin", value: "16px", description: "Section margins" },
          { token: "gap", value: "16px", description: "Grid gaps" }
        ]
      },
      {
        name: "Radius",
        tokens: [
          { token: "--radius-sm", value: "6px", description: "Small radius" },
          { token: "--radius-md", value: "10px", description: "Medium radius" },
          { token: "--radius-lg", value: "16px", description: "Large radius" },
          { token: "--radius-full", value: "9999px", description: "Full radius" }
        ]
      },
      {
        name: "Shadows",
        tokens: [
          { token: "--shadow-sm", value: "0 2px 8px rgba(0,0,0,0.3)", description: "Small shadow" },
          { token: "--shadow-md", value: "0 4px 16px rgba(0,0,0,0.4)", description: "Medium shadow" },
          { token: "--shadow-lg", value: "0 8px 32px rgba(0,0,0,0.5)", description: "Large shadow" }
        ]
      },
      {
        name: "Typography",
        tokens: [
          { token: "font-family", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", description: "System font stack" },
          { token: "font-size", value: "14px-20px", description: "Base font sizes" },
          { token: "font-weight", value: "400-600", description: "Font weights" }
        ]
      },
      {
        name: "Component Sizes",
        tokens: [
          { token: "button-height", value: "40px+", description: "Minimum button height" },
          { token: "card-padding", value: "20px", description: "Card padding" },
          { token: "touch-target", value: "44px min", description: "Touch target size" }
        ]
      }
    ]
  },
  sharedComponentRegistry: {
    title: "Shared Component Registry",
    categories: [
      {
        name: "Layout Components",
        components: [
          {
            name: "App",
            usage: "Root component with routing logic",
            rule: "Do not modify routing or auth logic",
            extension: "Safe to add new routes if not conflicting",
            warning: "Avoid duplicate routing patterns"
          },
          {
            name: "Dashboard",
            usage: "Main chat interface with socket integration",
            rule: "Do not modify socket event handlers or WebRTC logic",
            extension: "Safe to add UI features if not touching core logic",
            warning: "Avoid duplicate chat UI patterns"
          },
          {
            name: "AdminPanel",
            usage: "Admin interface with tab navigation",
            rule: "Follow existing tab pattern for new admin pages",
            extension: "Safe to add new admin tabs",
            warning: "Avoid duplicate admin UI patterns"
          }
        ]
      },
      {
        name: "Chat Components",
        components: [
          {
            name: "MobileChatLayout",
            usage: "Responsive chat layout for mobile devices",
            rule: "Maintain touch targets and responsive rules",
            extension: "Safe to extend with new chat features",
            warning: "Avoid breaking mobile chat flow"
          },
          {
            name: "MobileConversationScreen",
            usage: "Individual conversation view",
            rule: "Preserve message sending logic",
            extension: "Safe to add message features",
            warning: "Avoid duplicate conversation UI"
          },
          {
            name: "MobileUserListScreen",
            usage: "User selection interface",
            rule: "Keep user selection and socket events",
            extension: "Safe to add user features",
            warning: "Avoid duplicate user list patterns"
          }
        ]
      },
      {
        name: "Call Components",
        components: [
          {
            name: "CallOverlay",
            usage: "Video call interface overlay",
            rule: "Do not modify WebRTC connection logic",
            extension: "Safe to add call UI features",
            warning: "Avoid duplicate call overlay patterns"
          },
          {
            name: "CallHistoryPage",
            usage: "Call history and management",
            rule: "Preserve call history data flow",
            extension: "Safe to add history features",
            warning: "Avoid duplicate history UI"
          },
          {
            name: "CallTimeoutNotice",
            usage: "Call timeout notifications",
            rule: "Keep timeout logic intact",
            extension: "Safe to customize timeout messages",
            warning: "Avoid duplicate timeout patterns"
          }
        ]
      },
      {
        name: "Admin Components",
        components: [
          {
            name: "AdminLogin",
            usage: "Admin authentication interface",
            rule: "Do not modify auth flow",
            extension: "Safe to add login UI features",
            warning: "Avoid duplicate login patterns"
          },
          {
            name: "QAGate",
            usage: "QA testing interface",
            rule: "Follow existing QA patterns",
            extension: "Safe to add QA features",
            warning: "Avoid duplicate QA UI patterns"
          },
          {
            name: "ProjectBrainDashboard",
            usage: "Project brain monitoring interface",
            rule: "Use static data only, no core modifications",
            extension: "Safe to add monitoring panels",
            warning: "Avoid duplicate dashboard patterns"
          }
        ]
      },
      {
        name: "Common UI Components",
        components: [
          {
            name: "Login",
            usage: "User authentication interface",
            rule: "Do not modify auth logic",
            extension: "Safe to add login features",
            warning: "Avoid duplicate login patterns"
          },
          {
            name: "SettingsPage",
            usage: "User settings management",
            rule: "Preserve settings data flow",
            extension: "Safe to add setting options",
            warning: "Avoid duplicate settings UI"
          },
          {
            name: "ProfilePage",
            usage: "User profile management",
            rule: "Keep profile data intact",
            extension: "Safe to add profile features",
            warning: "Avoid duplicate profile patterns"
          }
        ]
      },
      {
        name: "Project Brain Components",
        components: [
          {
            name: "ProjectBrainHeader",
            usage: "Dashboard header with status",
            rule: "Static data only",
            extension: "Safe to customize header content",
            warning: "Avoid duplicate header patterns"
          },
          {
            name: "ProjectHealthCards",
            usage: "System health status cards",
            rule: "Static data only",
            extension: "Safe to add health metrics",
            warning: "Avoid duplicate card patterns"
          },
          {
            name: "StructureLockStatus",
            usage: "Locked system areas display",
            rule: "Static documentation only",
            extension: "Safe to add lock documentation",
            warning: "Avoid duplicate lock displays"
          }
        ]
      }
    ]
  },
  responsiveSafetyPanel: {
    title: "Responsive Safety Panel",
    rules: [
      {
        category: "Desktop Layout",
        rules: [
          "Admin sidebar: 260px fixed width",
          "Main content: flexible width with padding",
          "Grid layouts: 2-3 columns for cards/panels",
          "Safe area: 24px padding around content",
          "Touch targets: 40px+ button heights"
        ]
      },
      {
        category: "Tablet Layout",
        rules: [
          "Admin sidebar: collapsible or overlay",
          "Main content: 2-column grid maximum",
          "Cards stack logically in 2 columns",
          "Touch targets: minimum 44px",
          "No horizontal scrolling"
        ]
      },
      {
        category: "Mobile Layout",
        rules: [
          "Single column layout only",
          "Cards stack vertically",
          "44px minimum touch targets",
          "No horizontal overflow",
          "Chat composer stays above keyboard",
          "Admin navigation uses full width"
        ]
      },
      {
        category: "Safe Area Rules",
        rules: [
          "Respect device safe areas",
          "16px minimum padding from edges",
          "Chat input stays visible during typing",
          "Call buttons remain accessible",
          "Admin panels scroll vertically only"
        ]
      },
      {
        category: "Grid Safety",
        rules: [
          "Use CSS Grid for responsive layouts",
          "Auto-fit columns with min-width constraints",
          "Gap: 16px between items",
          "No fixed pixel widths on grids",
          "Test all breakpoints: 768px, 1024px"
        ]
      },
      {
        category: "Component Safety",
        rules: [
          "All interactive elements: 44px minimum",
          "Text inputs: 44px height minimum",
          "Buttons: 40px height, clear labels",
          "Links: underlined on hover",
          "Icons: 24px minimum with labels"
        ]
      }
    ]
  },
  featureRoadmapBoard: {
    title: "Feature Roadmap Board",
    phases: [
      {
        phase: "Now",
        color: "var(--neon-success)",
        features: [
          "Project Brain Dashboard static panels",
          "Structure lock visibility and documentation",
          "Real-time safety monitoring display",
          "Component registry documentation",
          "Design token inspector",
          "Responsive safety guidelines",
          "P2P Media Transfer (Phase 58)",
          "Coturn TURN Relay Fallback (Phase 59)",
          "Dynamic Connectivity Policies (Phase 59)",
          "Production Observability & Cost Guard (Phase 60)"
        ]
      },
      {
        phase: "Next",
        color: "var(--neon-primary)",
        features: [
          "API-based admin insights panel",
          "Message system health monitoring",
          "Call system health monitoring",
          "Feature flag management UI",
          "System checklist export functionality",
          "Admin audit log enhancements"
        ]
      },
      {
        phase: "Later",
        color: "var(--neon-secondary)",
        features: [
          "Media file attachments in chat",
          "Push notification system",
          "Flutter mobile app development",
          "Group chat functionality",
          "Advanced user roles and permissions",
          "Multi-language support"
        ]
      },
      {
        phase: "Hold / Verify Required",
        color: "var(--neon-warning)",
        features: [
          "Group video calls (WebRTC complexity)",
          "Redis production adapter deployment",
          "PostgreSQL database migration",
          "Push notification backend infrastructure",
          "Third-party API integrations",
          "Advanced analytics and reporting"
        ]
      }
    ]
  },
  systemChecklistExport: {
    title: "System Checklist Export",
    checklist: `# ZYMI/QiBo Project Brain Checklist

## Phase A - Core Safety Implementation ✅
- [x] Project Brain Dashboard route added
- [x] Static health cards implemented
- [x] Real-time core status panel created
- [x] Structure lock status documented
- [x] Risk detection board active
- [x] No core file modifications
- [x] Responsive design applied

## Phase B - Extended Monitoring ✅
- [x] Feature progress tracker completed
- [x] Socket event map documented
- [x] WebRTC flow guard locked
- [x] Route map visualizer active
- [x] Design token inspector created
- [x] All static data only
- [x] Mobile responsive tested

## Phase C Part 1 - Registry & Roadmap ✅
- [x] Shared component registry documented
- [x] Responsive safety panel active
- [x] Feature roadmap board created
- [x] System checklist export ready
- [x] No API dependencies added
- [x] All components modular

## Core Safety Locks 🔒
- [x] server/index.js untouched
- [x] SocketContext.jsx unmodified
- [x] Dashboard.jsx preserved
- [x] WebRTC logic locked
- [x] Socket events documented
- [x] Database schema safe
- [x] Authentication intact

## Real-time System Status 📊
- [x] Socket connections monitored
- [x] WebRTC calls tracked
- [x] Message flow active
- [x] Admin access protected
- [x] Responsive design verified

## Next Steps 📋
- [ ] Implement API-based panels (Phase C Part 2)
- [ ] Add admin insights monitoring
- [ ] Enable message system health
- [ ] Activate call system health
- [ ] Deploy feature flags
- [ ] Export functionality testing

---
*Generated by Project Brain Dashboard - ${new Date().toLocaleString()}*`
  }
};