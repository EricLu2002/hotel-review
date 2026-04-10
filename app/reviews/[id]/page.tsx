import ReviewDetail from '@/components/ReviewDetail';
import { Review } from '@/types/review';

async function fetchReview(id: string): Promise<Review | null> {
  const response = await fetch(`/api/reviews/${id}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.review ?? null;
}

interface Props {
  params: {
    id: string;
  };
}

export default async function ReviewPage({ params }: Props) {
  const review = await fetchReview(params.id);

  if (!review) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200/80 bg-rose-50/80 p-8 text-rose-700 shadow-soft">
          <h1 className="text-2xl font-semibold">未找到评论</h1>
          <p className="mt-3 text-slate-700">请返回首页，重新选择筛选条件或检查评论 ID。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <ReviewDetail review={review} />
      </div>
    </main>
  );
}
