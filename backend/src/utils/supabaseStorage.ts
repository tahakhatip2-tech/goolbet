/**
 * fileStorage.ts
 * 
 * محرك تخزين الملفات - يُستبدل بالمزود الجديد عند توفر بيانات الاتصال.
 * حالياً يعمل بالتخزين المحلي فقط (uploads/).
 */
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// نأكد من وجود مجلد الرفع
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * "رفع" ملف: في الوضع الحالي يُبقي الملف في مجلد uploads المحلي
 * ويعيد مساره النسبي. سيُستبدل بالمزود السحابي لاحقاً.
 */
export async function uploadFile(
  localPath: string,
  fileName: string,
  _mimeType: string
): Promise<string> {
  const dest = path.join(UPLOADS_DIR, fileName);

  // انقل الملف إلى مجلد uploads إن لم يكن فيه بالفعل
  if (localPath !== dest && fs.existsSync(localPath)) {
    fs.copyFileSync(localPath, dest);
    fs.unlinkSync(localPath);
  }

  // أعد URL نسبي (سيُستبدل بـ CDN URL لاحقاً)
  return `/uploads/${fileName}`;
}

/**
 * حذف ملف من التخزين.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Could not delete file:', err);
  }
}

/**
 * للتوافق مع الكود القديم - نفس uploadFile
 */
export const uploadFileToSupabase = uploadFile;
export const deleteFileFromSupabase = deleteFile;
export async function ensureBucketExists(): Promise<void> {
  // لا شيء مطلوب في وضع التخزين المحلي
}
