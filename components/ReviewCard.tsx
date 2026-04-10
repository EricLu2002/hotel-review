import Link from 'next/link';
import { Review } from '@/types/review';

interface Props {
  review: Review;
  onPreviewImage: (src: string) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ReviewCard({ review, onPreviewImage }: Props) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/60 hover:border-slate-300/80">
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-gradient-to-r from-green-100 to-blue-100 px-3 py-1 text-green-700 shadow-sm">{review.category}</span>
          <span className="font-semibold text-yellow-600">{Array(review.rating).fill('⭐').join('')}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{review.review_title}</h2>
            <p className="mt-1 text-sm text-slate-600">{review.hotel_name !== '未知酒店' ? `${review.hotel_name} · ` : ''}{review.fuzzy_room_type}</p>
          </div>

          <p className="text-slate-700 line-clamp-3">{review.review_text}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          {review.reviewer_name !== '匿名' && <div>{review.reviewer_name}</div>}
          <div>{formatDate(review.review_date)}</div>
        </div>

        {review.images?.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {review.images.slice(0, 2).map((src) => (
              <button
                type="button"
                key={src}
                onClick={() => onPreviewImage(src)}
                className="group overflow-hidden rounded-2xl bg-slate-100 transition-all duration-300 hover:brightness-110 hover:scale-105 hover:shadow-lg"
              >
                <img src={src} alt="评论图片" className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <Link
            href={`/reviews/${review.id}`}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105"
          >
            查看详情
          </Link>
        </div>
      </div>
    </article>
  );
}
