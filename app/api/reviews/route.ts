import { NextResponse } from 'next/server';
import { getInsforgeClient } from '@/lib/insforge-client';

const DEFAULT_PAGE_SIZE = 12;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));
    const keyword = url.searchParams.get('keyword')?.trim() ?? '';
    const stars = url.searchParams.getAll('stars').map(Number).filter((value) => !Number.isNaN(value));
    const roomTypes = url.searchParams.getAll('room_type').filter(Boolean);
    const travelTypes = url.searchParams.getAll('travel_type').filter(Boolean);
    const categories = url.searchParams.getAll('category').filter(Boolean);
    const fuzzyRoomTypes = url.searchParams.getAll('fuzzy_room_type').filter(Boolean);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const insforgeClient = getInsforgeClient();
    let query = insforgeClient.database.from('comments').select('*', { count: 'exact' });

    if (keyword) {
      query = query.textSearch('comment', keyword);
    }

    if (stars.length) {
      query = query.in('star', stars);
    }

    if (roomTypes.length) {
      query = query.in('room_type', roomTypes);
    }

    if (travelTypes.length) {
      query = query.in('travel_type', travelTypes);
    }

    if (categories.length) {
      const orConditions = categories.flatMap((category) => [
        `category1.eq.${category}`,
        `category2.eq.${category}`,
        `category3.eq.${category}`,
      ]);
      query = query.or(orConditions.join(','));
    }

    if (fuzzyRoomTypes.length) {
      query = query.in('fuzzy_room_type', fuzzyRoomTypes);
    }

    if (startDate) {
      query = query.gte('publish_date', startDate);
    }
    if (endDate) {
      query = query.lte('publish_date', endDate);
    }

    const offset = (page - 1) * pageSize;
    query = query.order('publish_date', { ascending: false }).range(offset, offset + pageSize - 1);

    const response = await query;
    if (response.error) {
      return NextResponse.json({ error: response.error.message }, { status: 500 });
    }

    return NextResponse.json({
      reviews: response.data ?? [],
      total: response.count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
