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
 *
 * Filter props drive CISO quick filters (pending / active / auto-approved).
 * Multi-status filters are supported via `filter.status` as a string array.
 *
 * @see lib/api/requests.ts - fetchRequests() for API calls
 * @see components/Pagination.tsx - Pagination controls
 * @see components/RequestAnswersPanel.tsx - Read-only questionnaire answers
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
import { useRole } from "@/contexts/RoleContext";
import { Pagination } from "./Pagination";
import { RequestAnswersPanel } from "./RequestAnswersPanel";
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
  showActions = true,
  onActionComplete,
  pageSize = 10,
}: RequestQueueProps) {
  const { currentUser } = useRole();
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
    const result = await fetchRequests({
      ...parsedFilter,
      page,
      limit: pageSize,
    });

    if (result.success && result.requests) {
      setRequests(result.requests);
      setPagination(result.pagination || null);
    } else {
      setError(result.error || "Failed to load requests");
      setRequests([]);
    }

    setLoading(false);
  }, [filterKey, page, pageSize]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (
    requestId: string,
    action: (typeof RequestAction)[keyof typeof RequestAction],
    targetUserId?: string
  ) => {
    setActionState({ loading: true, error: null, requestId });

    const result = await applyAction(
      requestId,
      action,
      currentUser.role,
      currentUser.id,
      { targetUserId }
    );

    if (result.success) {
      setActionState({ loading: false, error: null, requestId: null });
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
          {request.status === "PENDING_CISO" && (
            <button
              type="button"
              onClick={() =>
                handleAction(
                  request._id,
                  RequestAction.ROUTE_TO_MANAGER,
                  "manager@test.local"
                )
              }
              disabled={isActionLoading}
              style={{
                ...buttonBase,
                backgroundColor: "#6366f1",
                color: "white",
              }}
            >
              העבר למנהל
            </button>
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
                        <div>{request.submittedByUserId || "—"}</div>
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

                    {request.reviewNotes && (
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f1f5f9",
                          borderRadius: "6px",
                          marginBottom: "16px",
                        }}
                      >
                        <strong style={{ color: "#64748b", fontSize: "12px" }}>
                          הערות:
                        </strong>
                        <div style={{ marginTop: "4px" }}>{request.reviewNotes}</div>
                      </div>
                    )}

                    <RequestAnswersPanel answers={request.answers} />

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
    </div>
  );
}
