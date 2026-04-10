'use client';

import { useEffect, useMemo, useState } from 'react';
import ReviewCard from './ReviewCard';
import Pagination from './Pagination';
import ImageModal from './ImageModal';
import type { Review, ReviewPage } from '@/types/review';

const categories = ['整体满意度', '房间设施', '前台服务', '公共设施', '卫生状况', '交通便利性', '性价比', '安静程度', '景观/朝向', '周边配套', '退房/入住效率', '餐饮设施', '客房服务', '价格合理性'];
const starOptions = [5, 4, 3, 2, 1];
const roomTypeOptions = ['大床房', '双床房', '套房', '主题房'];
const pageSize = 12;

export default function ReviewBrowser() {
  const [keyword, setKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    }
    selectedStars.forEach((value) => params.append('stars', String(value)));
    selectedCategories.forEach((value) => params.append('category', value));
    selectedRoomTypes.forEach((value) => params.append('fuzzy_room_type', value));
    if (dateRange.startDate) {
      params.set('startDate', dateRange.startDate);
    }
    if (dateRange.endDate) {
      params.set('endDate', dateRange.endDate);
    }
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return params.toString();
  }, [keyword, selectedCategories, selectedStars, selectedRoomTypes, dateRange, page]);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/reviews?${queryString}`);
        const data: ReviewPage & { error?: string } = await response.json();
        if (!response.ok || data.error) {
          setError(data.error ?? '获取评论失败，请稍后重试。');
          setReviews([]);
          setTotal(0);
        } else {
          setReviews(data.reviews);
          setTotal(data.total);
        }
      } catch (err) {
        setError('网络连接失败，请检查您的网络。');
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [queryString]);

  const toggleCategory = (category: string) => {
    setPage(1);
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  const toggleStar = (star: number) => {
    setPage(1);
    setSelectedStars((current) =>
      current.includes(star) ? current.filter((value) => value !== star) : [...current, star]
    );
  };

  const toggleRoomType = (roomType: string) => {
    setPage(1);
    setSelectedRoomTypes((current) =>
      current.includes(roomType) ? current.filter((item) => item !== roomType) : [...current, roomType]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedStars([]);
    setSelectedRoomTypes([]);
    setDateRange({ startDate: '', endDate: '' });
    setPage(1);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">筛选条件</h2>
            <p className="mt-2 text-sm text-slate-600">使用多个筛选条件组合，精准定位目标评论。</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">关键词搜索</label>
            <input
              type="search"
              value={keyword}
              onChange={(event) => {
                setPage(1);
                setKeyword(event.target.value);
              }}
              placeholder="输入酒店名、地点或评论关键词"
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">星级</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {starOptions.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => toggleStar(star)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    selectedStars.includes(star)
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                  }`}
                >
                  {star} ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">评论类别</p>
            <div className="mt-3 grid gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`w-full rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                    selectedCategories.includes(category)
                      ? 'border-green-500 bg-green-500 text-white shadow-md shadow-green-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50 hover:shadow-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">房型</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roomTypeOptions.map((roomType) => (
                <button
                  key={roomType}
                  type="button"
                  onClick={() => toggleRoomType(roomType)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    selectedRoomTypes.includes(roomType)
                      ? 'border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50 hover:shadow-sm'
                  }`}
                >
                  {roomType}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-600">起始日期</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(event) => {
                setPage(1);
                setDateRange((current) => ({ ...current, startDate: event.target.value }));
              }}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <label className="block text-sm text-slate-600">结束日期</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(event) => {
                setPage(1);
                setDateRange((current) => ({ ...current, endDate: event.target.value }));
              }}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-3xl bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:from-slate-200 hover:to-slate-300 hover:shadow-md"
          >
            清除筛选
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">当前结果</p>
              <h2 className="text-2xl font-semibold text-slate-950">{loading ? '加载中…' : `共 ${total} 条评论`}</h2>
            </div>
            <p className="text-sm text-slate-500">
              使用关键词、星级、类别和日期范围组合搜索。
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200/80 bg-red-50/95 p-6 text-red-700 shadow-lg shadow-red-200/50 backdrop-blur-sm">
            {error}
          </div>
        ) : null}

        {reviews.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onPreviewImage={setPreviewImage} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/60 bg-slate-50/95 p-10 text-center text-slate-600 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
            {loading ? '正在加载评论...' : '没有符合当前筛选条件的评论。请调整关键词或筛选条件。'}
          </div>
        )}

        {total > pageSize ? (
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        ) : null}
      </div>

      <ImageModal open={Boolean(previewImage)} imageUrl={previewImage} onClose={() => setPreviewImage('')} />
    </div>
  </div>
</section>
  );
}
