import { render, screen } from '@testing-library/react';
import ReviewCard from '@/components/ReviewCard';

const review = {
  id: 111,
  hotel_name: '海景酒店',
  location: '上海',
  reviewer_name: '张三',
  review_title: '房间体验优质',
  review_text: '房间干净、服务周到，早餐种类丰富。',
  review_date: '2025-03-10',
  rating: 5,
  category: '房间质量',
  images: ['https://example.com/test.jpg'],
};

describe('ReviewCard', () => {
  it('renders review summary and preview button', () => {
    render(<ReviewCard review={review} onPreviewImage={() => {}} />);

    expect(screen.getByText('房间体验优质')).toBeInTheDocument();
    expect(screen.getByText('海景酒店 · 上海')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('查看详情')).toBeInTheDocument();
  });
});
