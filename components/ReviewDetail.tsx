import Link from 'next/link';
import type { Review } from '@/types/review';

interface Props {
  review: Review;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ReviewDetail({ review }: Props) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">评论详情</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">{review.review_title}</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            返回列表
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">酒店名称</p>
            <p className="text-lg font-semibold text-slate-950">{review.hotel_name}</p>
            <p className="text-sm text-slate-500">地点</p>
            <p className="text-base text-slate-700">{review.location}</p>
          </div>
          <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">评分</p>
            <p className="text-lg font-semibold text-slate-950">{Array(review.rating).fill('★').join('')}</p>
            <p className="text-sm text-slate-500">类别</p>
            <p className="text-base text-slate-700">{review.category}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>评论者：{review.reviewer_name}</span>
            <span>{formatDate(review.review_date)}</span>
          </div>
          <p className="mt-6 whitespace-pre-line text-slate-700">{review.review_text}</p>
        </div>

        {review.images?.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {review.images.map((src) => (
              <div key={src} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <img src={src} alt="评论图片" className="h-72 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
