// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";

// interface ListPaginationProps {
//   currentCount: number;
//   currentPage: number;
//   isLoading?: boolean;
//   onNextPage: () => void;
//   onPageSizeChange?: (pageSize: number) => void;
//   onPreviousPage: () => void;
//   pageSize?: number;
//   pageSizeOptions?: number[];
//   showSummary?: boolean;
//   totalCount: number;
//   totalPages: number;
// }

// export function ListPagination({
//   currentCount,
//   currentPage,
//   isLoading = false,
//   onNextPage,
//   onPageSizeChange,
//   onPreviousPage,
//   pageSize,
//   pageSizeOptions = [10, 20, 40, 50],
//   showSummary = true,
//   totalCount,
//   totalPages,
// }: ListPaginationProps) {
//   const normalizedTotalPages = Math.max(totalPages, 1);
//   const canGoPrevious = currentPage > 1 && !isLoading;
//   const canGoNext = currentPage < normalizedTotalPages && !isLoading;

//   return (
//     <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
//       <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
//         {showSummary ? (
//           <div className="text-base font-medium text-muted-foreground">
//             Showing <span className="text-foreground">{currentCount}</span> of{" "}
//             <span className="text-foreground">{totalCount}</span>
//           </div>
//         ) : null}
//         {pageSize ? (
//           <div className="pagination-limit-container p-0 m-0">
//             <select
//               value={pageSize}
//               onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
//               disabled={isLoading || !onPageSizeChange}
//               className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
//               aria-label="Show results limit"
//             >
//               {pageSizeOptions.map((option) => (
//                 <option key={option} value={option}>
//                   SHOW RESULTS ({option})
//                 </option>
//               ))}
//             </select>
//           </div>
//         ) : null}
//       </div>
//       <div className="flex items-center gap-2">
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={onPreviousPage}
//           disabled={!canGoPrevious}
//         >
//           <ChevronLeft className="h-4 w-4" />
//           Previous
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={onNextPage}
//           disabled={!canGoNext}
//         >
//           Next
//           <ChevronRight className="h-4 w-4" />
//         </Button>
//       </div>
//     </div>
//   );
// }

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListPaginationProps {
  currentCount: number;
  currentPage: number;
  isLoading?: boolean;
  onNextPage: () => void;
  onPageSizeChange?: (pageSize: number) => void;
  onPreviousPage: () => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  showSummary?: boolean;
  totalCount: number;
  totalPages: number;
}

export function ListPagination({
  currentCount,
  currentPage,
  isLoading = false,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  pageSize,
  pageSizeOptions = [10, 20, 40, 50],
  showSummary = true,
  totalCount,
  totalPages,
}: ListPaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1);
  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < normalizedTotalPages && !isLoading;

  return (
    <div className="flex items-center justify-between gap-2 border-t pt-2">
      {showSummary ? (
        <p className="shrink-0 text-[11px] text-muted-foreground">
          <span className="text-foreground">{currentCount}</span>
          {" / "}
          <span className="text-foreground">{totalCount}</span>
        </p>
      ) : null}

      <div className="flex items-center gap-1.5 ml-auto">
        {pageSize ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            disabled={isLoading || !onPageSizeChange}
            className="h-6 rounded border border-input bg-background px-1.5 text-[11px] outline-none focus-visible:border-ring"
            aria-label="Show results limit"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
          className="h-6 w-6 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="text-[11px] text-muted-foreground tabular-nums">
          {currentPage}/{normalizedTotalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}