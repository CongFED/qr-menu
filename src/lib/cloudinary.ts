import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dn8ovj988',
  api_key: process.env.CLOUDINARY_API_KEY || '395488636114573',
  api_secret: process.env.CLOUDINARY_API_SECRET || '95JtFRhXmMe3fKW-CO82GKY8px0',
  secure: true,
});

export async function uploadImageToCloudinary(
  buffer: Buffer,
  mimeType: string,
  folder?: string
): Promise<{ url: string; publicId: string }> {
  const targetFolder = folder || process.env.CLOUDINARY_FOLDER || 'wedding-online';
  const base64Str = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64Str, {
    folder: targetFolder,
    resource_type: 'image',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export default cloudinary;
