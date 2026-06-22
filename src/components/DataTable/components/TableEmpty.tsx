interface TableEmptyProps {
  colCount: number;
  title?: string;
  description?: string;
  isError?: boolean;
  onRetry?: () => void;
}

export function TableEmpty({
  colCount,
  title,
  description,
  isError,
  onRetry,
}: TableEmptyProps) {
  return (
    <tbody>
      <tr>
        <td colSpan={colCount}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {isError ? (
              <>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {title ?? "Failed to load records"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {description ?? "Something went wrong. Try refreshing."}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-4 rounded-lg border border-[#E8EAED] bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {title ?? "No records found"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {description ?? "Try adjusting your search or filters."}
                </p>
              </>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
