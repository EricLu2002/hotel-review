import { NextResponse } from 'next/server';
import { getInsforgeClient } from '@/lib/insforge-client';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });
    }

    const insforgeClient = getInsforgeClient();
    const response = await insforgeClient.database.from('comments').select('*').eq('id', id).single();
    if (response.error) {
      return NextResponse.json({ error: response.error.message }, { status: 500 });
    }
    return NextResponse.json({ review: response.data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
