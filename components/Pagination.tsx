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

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: enabled ? "#ffffff" : "#f1f5f9",
    color: enabled ? "#1e293b" : "#94a3b8",
    cursor: enabled && !disabled ? "pointer" : "not-allowed",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.15s ease",
  });

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
        padding: "16px 0",
        direction: "rtl",
      }}
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoPrev || disabled}
        style={buttonStyle(canGoPrev)}
        aria-label="Previous page"
      >
        ←
      </button>

      <span
        style={{
          fontSize: "14px",
          color: "#475569",
          minWidth: "120px",
          textAlign: "center",
        }}
      >
        עמוד {page} מתוך {totalPages}
        {total !== undefined && (
          <span style={{ color: "#94a3b8", marginRight: "8px" }}>
            ({total} סה״כ)
          </span>
        )}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext || disabled}
        style={buttonStyle(canGoNext)}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}
