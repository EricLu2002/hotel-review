import ReviewBrowser from '@/components/ReviewBrowser';

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-soft backdrop-blur">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">酒店评论浏览</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              按条件筛选、关键词搜索、查看图片的酒店评论
            </h1>
            <p className="mt-4 text-slate-600 sm:text-lg">
              快速浏览真实评论，按星级、类别、日期过滤，支持关键词搜索与图像预览。
            </p>
          </div>
        </section>

        <ReviewBrowser />
      </div>
    </main>
  );
}
