interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const previousDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 text-sm text-slate-600 shadow-soft">
      <p>
        共 {total} 条评论 · 第 {page} / {pageCount} 页
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={previousDisabled}
          onClick={() => onChange(page - 1)}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          上一页
        </button>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => onChange(page + 1)}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
