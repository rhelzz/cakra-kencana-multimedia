import { revalidatePath } from 'next/cache';

// Called by the Joomla plugin (plg_system_nextrevalidate) on every content save.
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidated: false }, { status: 403 });
  }
  revalidatePath('/', 'layout'); // '/' + the layout that renders the navbar
  return Response.json({ revalidated: true, at: Date.now() });
}
