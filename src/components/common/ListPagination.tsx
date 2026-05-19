import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  currentCount: number;
  currentPage: number;
  isLoading?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  totalCount: number;
  totalPages: number;
}

export function ListPagination({
  currentCount,
  currentPage,
  isLoading = false,
  onNextPage,
  onPreviousPage,
  totalCount,
  totalPages,
}: ListPaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < normalizedTotalPages && !isLoading;

  return (
    <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>
          Current: {currentCount}/{totalCount}
        </span>
        <span>
          Page: {currentPage} of {normalizedTotalPages}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
