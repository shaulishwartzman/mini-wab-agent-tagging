/**
 * RequestQueue - Paginated request list with role-based actions.
 *
 * Displays a filterable, paginated list of agent requests. Shows different
 * actions based on the viewer's role:
 * - CISO: Approve, Reject, Route to Manager
 * - Manager: Recommend Approve, Recommend Reject
 * - Employee: View only (no actions)
 *
 * Expanding a card shows metadata plus a read-only questionnaire panel
 * (`RequestAnswersPanel`) so reviewers can inspect all answers before acting.
 * Optional CISO↔manager notes are drafted inside `CorrespondencePanel`
 * (below questionnaire, above action buttons) and sent as `reviewNotes`.
 * Correspondence is CISO/Manager only — hidden on employee "הבקשות שלי".
 *
 * @see lib/api/requests.ts - fetchRequests() for API calls
 * @see components/Pagination.tsx - Pagination controls
 * @see components/RequestAnswersPanel.tsx - Read-only questionnaire answers
 * @see components/CorrespondencePanel.tsx - Collapsible CISO↔manager thread
 * @see lib/utils/requestHelpers.ts - Status labels and colors
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchRequests,
  applyAction,
  type FetchRequestsOptions,
  type AgentRequestResponse,
  type PaginationInfo,
} from "@/lib/api/requests";
import { UserRole, RequestAction } from "@/lib/types";
import { Pagination } from "./Pagination";
import { RequestAnswersPanel } from "./RequestAnswersPanel";
import { CorrespondencePanel } from "./CorrespondencePanel";
import {
  getStatusLabel,
  getStatusBadgeStyle,
  isTerminalStatus,
  formatDate,
  getRecommendationLabel,
} from "@/lib/utils/requestHelpers";

export type RequestQueueProps = {
  /** API filter parameters. */
  filter: FetchRequestsOptions;
  /** Section heading. */
  title: string;
  /** Current user (for actions and role-based rendering). */
  currentUser: {
    id: string;
    role: (typeof UserRole)[keyof typeof UserRole];
    name: string;
  };
  /** Whether to show action buttons (based on role permissions). */
  showActions?: boolean;
  /** Callback after an action completes (for parent refresh). */
  onActionComplete?: () => void;
  /** Items per page (default 10). */
  pageSize?: number;
};

type ActionState = {
  loading: boolean;
  error: string | null;
  requestId: string | null;
};

/**
 * Paginated request queue with role-based actions.
 */
export function RequestQueue({
  filter,
  title,
  currentUser,
  showActions = true,
  onActionComplete,
  pageSize = 10,
}: RequestQueueProps) {
  const [requests, setRequests] = useState<AgentRequestResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({
    loading: false,
    error: null,
    requestId: null,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Optional per-request note drafted before an action (CISO↔manager Q&A). */
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  
  // Manager routing modal state
  const [routingModal, setRoutingModal] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [routingNote, setRoutingNote] = useState<string>("");
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Stabilize filter dependency so inline objects from the parent don't
  // retrigger fetch on every render.
  const filterKey = JSON.stringify(filter);

  // Reset to first page whenever the filter changes (tab switch).
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const parsedFilter = JSON.parse(filterKey) as FetchRequestsOptions;
    console.log("🔍 RequestQueue loading with filter:", parsedFilter);
    console.log("🔍 Current user:", { id: currentUser.id, role: currentUser.role, name: currentUser.name });
    
    const result = await fetchRequests({
      ...parsedFilter,
      page,
      limit: pageSize,
    });

    if (result.success && result.requests) {
      console.log("📋 Found", result.requests.length, "requests");
      if (result.requests.length > 0) {
        console.log("📋 Sample request:", {
          id: result.requests[0]._id,
          status: result.requests[0].status,
          assignedTo: result.requests[0].assignedTo,
          assignedToUserId: result.requests[0].assignedToUserId,
        });
      }
      setRequests(result.requests);
      setPagination(result.pagination || null);
    } else {
      setError(result.error || "Failed to load requests");
      setRequests([]);
    }

    setLoading(false);
  }, [filterKey, page, pageSize, currentUser]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Fetch managers when component mounts (for CISO routing)
  useEffect(() => {
    if (currentUser.role === UserRole.CISO) {
      fetchManagers();
    }
  }, [currentUser.role]);

  async function fetchManagers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && data.users) {
        const managerList = data.users
          .filter((u: { role: string }) => u.role === UserRole.MANAGER)
          .map((u: { id: string; name: string; email: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          }));
        setManagers(managerList);
      }
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    }
  }

  const handleAction = async (
    requestId: string,
    action: (typeof RequestAction)[keyof typeof RequestAction],
    targetUserId?: string,
    customNote?: string
  ) => {
    setActionState({ loading: true, error: null, requestId });

    // Use custom note (from modal) or fallback to correspondence panel note
    const reviewNotes = customNote?.trim() || (actionNotes[requestId] || "").trim();

    const result = await applyAction(
      requestId,
      action,
      currentUser.role,
      currentUser.id,
      {
        targetUserId,
        reviewNotes: reviewNotes || undefined,
      }
    );

    if (result.success) {
      setActionState({ loading: false, error: null, requestId: null });
      setActionNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      loadRequests();
      onActionComplete?.();
    } else {
      setActionState({
        loading: false,
        error: result.userMessage || result.error || "Action failed",
        requestId,
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderActions = (request: AgentRequestResponse) => {
    if (!showActions || isTerminalStatus(request.status)) {
      return null;
    }

    const isActionLoading =
      actionState.loading && actionState.requestId === request._id;
    const buttonBase: React.CSSProperties = {
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "13px",
      fontWeight: 500,
      cursor: isActionLoading ? "wait" : "pointer",
      border: "none",
      transition: "all 0.15s ease",
    };

    if (currentUser.role === UserRole.CISO) {
      return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Show approve/reject only when pending for CISO */}
          {request.status === "PENDING_CISO" && (
            <>
              <button
                type="button"
                onClick={() => handleAction(request._id, RequestAction.APPROVE)}
                disabled={isActionLoading}
                style={{
                  ...buttonBase,
                  backgroundColor: "#22c55e",
                  color: "white",
                }}
              >
                אשר
              </button>
              <button
                type="button"
                onClick={() => handleAction(request._id, RequestAction.REJECT)}
                disabled={isActionLoading}
                style={{
                  ...buttonBase,
                  backgroundColor: "#ef4444",
                  color: "white",
                }}
              >
                דחה
              </button>
              <button
                type="button"
                onClick={() => setRoutingModal({ open: true, requestId: request._id })}
                disabled={isActionLoading}
                style={{
                  ...buttonBase,
                  backgroundColor: "#6366f1",
                  color: "white",
                }}
              >
                העבר להתייעצות עם מנהל
              </button>
            </>
          )}
          
          {/* When pending with manager, show waiting message */}
          {request.status === "PENDING_MANAGER" && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              ממתין להמלצת מנהל
            </div>
          )}
        </div>
      );
    }

    if (currentUser.role === UserRole.MANAGER) {
      return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              handleAction(request._id, RequestAction.RECOMMEND_APPROVE)
            }
            disabled={isActionLoading}
            style={{
              ...buttonBase,
              backgroundColor: "#22c55e",
              color: "white",
            }}
          >
            המלץ לאישור
          </button>
          <button
            type="button"
            onClick={() =>
              handleAction(request._id, RequestAction.RECOMMEND_REJECT)
            }
            disabled={isActionLoading}
            style={{
              ...buttonBase,
              backgroundColor: "#ef4444",
              color: "white",
            }}
          >
            המלץ לדחייה
          </button>
        </div>
      );
    }

    return null;
  };

  const containerStyle: React.CSSProperties = {
    direction: "rtl",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    marginBottom: "12px",
    overflow: "hidden",
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: "16px",
    backgroundColor: "#fafafa",
    borderTop: "1px solid #e2e8f0",
  };

  if (loading && requests.length === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>{title}</h2>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          טוען...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>
        {title}
      </h2>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {requests.length === 0 && !loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#64748b",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          אין בקשות להצגה
        </div>
      ) : (
        <>
          {requests.map((request) => {
            const badgeStyle = getStatusBadgeStyle(request.status);
            const isExpanded = expandedId === request._id;
            const hasActionError =
              actionState.error && actionState.requestId === request._id;

            return (
              <div key={request._id} style={cardStyle}>
                <div
                  style={cardHeaderStyle}
                  onClick={() => toggleExpand(request._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleExpand(request._id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>
                      {request.agentName}
                    </span>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        ...badgeStyle,
                        border: `1px solid ${badgeStyle.borderColor}`,
                      }}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    {formatDate(request.createdAt)}
                    <span style={{ marginRight: "8px" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </span>
                </div>

                {isExpanded && (
                  <div style={cardBodyStyle}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#64748b", fontSize: "12px" }}>
                          רמת הסוכן:
                        </strong>
                        <div>{request.agentLevel || "—"}</div>
                      </div>
                      <div>
                        <strong style={{ color: "#64748b", fontSize: "12px" }}>
                          הוגש על ידי:
                        </strong>
                        <div>
                          {request.submittedByName || (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              {request.submittedByRole === "EMPLOYEE" && "עובד"}
                              {request.submittedByRole === "MANAGER" && "מנהל"}
                              {!request.submittedByRole && "משתמש"}
                            </span>
                          )}
                        </div>
                      </div>
                      {request.managerRecommendation && (
                        <div>
                          <strong style={{ color: "#64748b", fontSize: "12px" }}>
                            המלצת מנהל:
                          </strong>
                          <div>
                            {getRecommendationLabel(request.managerRecommendation)}
                          </div>
                        </div>
                      )}
                      {request.approvedBy && (
                        <div>
                          <strong style={{ color: "#64748b", fontSize: "12px" }}>
                            אושר על ידי:
                          </strong>
                          <div>{request.approvedBy}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <strong style={{ color: "#64748b", fontSize: "12px" }}>
                        פירוט ייעוד הסוכן:
                      </strong>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1e293b",
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          marginTop: "4px",
                        }}
                      >
                        {request.agentPurpose?.trim() || "—"}
                      </div>
                    </div>

                    <RequestAnswersPanel answers={request.answers} />

                    {(currentUser.role === UserRole.CISO ||
                      currentUser.role === UserRole.MANAGER) && (
                      <CorrespondencePanel
                        routingHistory={request.routingHistory}
                        viewerRole={currentUser.role}
                        canCompose={
                          showActions && !isTerminalStatus(request.status)
                        }
                        draftNote={actionNotes[request._id] || ""}
                        onDraftNoteChange={(value) =>
                          setActionNotes((prev) => ({
                            ...prev,
                            [request._id]: value,
                          }))
                        }
                        draftNoteId={`action-notes-${request._id}`}
                      />
                    )}

                    {hasActionError && (
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: "6px",
                          marginBottom: "16px",
                        }}
                      >
                        {actionState.error}
                      </div>
                    )}

                    {renderActions(request)}
                  </div>
                )}
              </div>
            );
          })}

          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
        </>
      )}

      {/* Manager Routing Modal */}
      {routingModal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setRoutingModal({ open: false, requestId: null });
            setSelectedManagerId("");
            setRoutingNote("");
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              העברה להתייעצות עם מנהל
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "#475569",
                  }}
                >
                  בחר מנהל
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">-- בחר מנהל --</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "8px",
                    color: "#475569",
                  }}
                >
                  הערה למנהל (אופציונלי)
                </label>
                <textarea
                  value={routingNote}
                  onChange={(e) => setRoutingNote(e.target.value)}
                  placeholder="נא לבדוק את הסיכון העסקי..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedManagerId) {
                      alert("נא לבחור מנהל");
                      return;
                    }
                    if (routingModal.requestId) {
                      await handleAction(
                        routingModal.requestId,
                        RequestAction.ROUTE_TO_MANAGER,
                        selectedManagerId,
                        routingNote
                      );
                      setRoutingModal({ open: false, requestId: null });
                      setSelectedManagerId("");
                      setRoutingNote("");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  העבר להתייעצות
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoutingModal({ open: false, requestId: null });
                    setSelectedManagerId("");
                    setRoutingNote("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
