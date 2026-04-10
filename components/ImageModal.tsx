interface ImageModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
}

export default function ImageModal({ open, imageUrl, onClose }: ImageModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={onClose}
      role="button"
      tabIndex={0}
    >
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-900 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-900 shadow-md"
        >
          关闭
        </button>
        <img src={imageUrl} alt="图片预览" className="h-[80vh] w-full object-contain bg-slate-950" />
      </div>
    </div>
  );
}
