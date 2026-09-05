import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if ((session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Staff routes protection
  if (pathname.startsWith('/staff') && !pathname.startsWith('/staff/login')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
    const role = (session.user as { role: string }).role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
  }

  // Admin API protection
  if (pathname.startsWith('/api/admin')) {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Staff API protection
  if (pathname.startsWith('/api/staff')) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as { role: string }).role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/api/admin/:path*', '/api/staff/:path*'],
};
