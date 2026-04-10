export interface Review {
  id: number;
  hotel_name: string;
  location: string;
  reviewer_name: string;
  review_title: string;
  review_text: string;
  review_date: string;
  rating: number;
  category: string;
  images: string[];
  fuzzy_room_type: string;
}

export interface ReviewPage {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
}
