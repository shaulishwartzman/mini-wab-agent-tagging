/**
 * Pagination component with prev/next arrows and page indicator.
 *
 * Displays: `< עמוד 1 מתוך 5 >`
 *
 * Used by RequestQueue to navigate paginated request lists.
 * Supports RTL layout (Hebrew).
 *
 * @see components/RequestQueue.tsx - Main consumer
 */

"use client";

export type PaginationProps = {
  /** Current page number (1-indexed). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of items (for display). */
  total?: number;
  /** Callback when page changes. */
  onPageChange: (page: number) => void;
  /** Whether to disable navigation (e.g., while loading). */
  disabled?: boolean;
};

/**
 * Simple pagination controls with prev/next arrows.
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={5}
 *   onPageChange={(p) => setCurrentPage(p)}
 * />
 * ```
 */
export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  };

  const handlePrev = () => {
    if (canGoPrev && !disabled) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && !disabled) {
      onPageChange(page + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "20px 0",
        direction: "rtl",
      }}
    >
      {/* Show back arrow only if not on first page */}
      {canGoPrev && (
        <button
          type="button"
          onClick={handlePrev}
          disabled={disabled}
          style={buttonStyle}
          aria-label="עמוד קודם"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = "#eff6ff";
              e.currentTarget.style.borderColor = "#2563eb";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
        >
          ← הקודם
        </button>
      )}

      <span
        style={{
          fontSize: "15px",
          color: "#1e293b",
          fontWeight: 600,
          minWidth: "150px",
          textAlign: "center",
          padding: "0 8px",
        }}
      >
        עמוד {page} מתוך {totalPages}
        {total !== undefined && (
          <span style={{ color: "#64748b", marginRight: "8px", fontWeight: 400 }}>
            ({total} סה״כ)
          </span>
        )}
      </span>

      {/* Show forward arrow only if not on last page */}
      {canGoNext && (
        <button
          type="button"
          onClick={handleNext}
          disabled={disabled}
          style={buttonStyle}
          aria-label="עמוד הבא"
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = "#eff6ff";
              e.currentTarget.style.borderColor = "#2563eb";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
        >
          הבא →
        </button>
      )}
    </div>
  );
}
