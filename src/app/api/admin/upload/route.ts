import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 });
    }

    // Validate type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Định dạng file không hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP, GIF, SVG.' },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dung lượng file tối đa là 10MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload directly to Cloudinary (folder: wedding-online)
    const result = await uploadImageToCloudinary(buffer, file.type);

    return NextResponse.json(
      {
        url: result.url,
        publicId: result.publicId,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Upload API] Cloudinary upload failed:', error);
    return NextResponse.json(
      { error: 'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
