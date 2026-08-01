import {
  supabase,
} from '../../lib/supabase/client';

const EXPERIENCE_IMAGES_BUCKET =
  'experience-images';

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function uploadExperienceImage(
  file: File
): Promise<string> {
  validateImage(file);

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      'Debes iniciar sesión para cargar una imagen.'
    );
  }

  const extension =
    getFileExtension(file);

  const fileName =
    `${Date.now()}-${createUniqueId()}.${extension}`;

  /*
   * Cada usuario carga archivos únicamente
   * dentro de su propia carpeta.
   */
  const filePath =
    `${user.id}/${fileName}`;

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        EXPERIENCE_IMAGES_BUCKET
      )
      .upload(
        filePath,
        file,
        {
          cacheControl:
            '3600',

          contentType:
            file.type,

          upsert:
            false,
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message ||
        'No fue posible cargar la imagen.'
    );
  }

  const {
    data: publicUrlData,
  } =
    supabase.storage
      .from(
        EXPERIENCE_IMAGES_BUCKET
      )
      .getPublicUrl(
        filePath
      );

  const publicUrl =
    publicUrlData.publicUrl;

  if (!publicUrl) {
    throw new Error(
      'La imagen fue cargada, pero no fue posible obtener su dirección pública.'
    );
  }

  return publicUrl;
}

function validateImage(
  file: File
): void {
  if (
    !allowedImageTypes.includes(
      file.type
    )
  ) {
    throw new Error(
      'La imagen debe estar en formato JPG, PNG o WEBP.'
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      'La imagen no puede pesar más de 8 MB.'
    );
  }
}

function getFileExtension(
  file: File
): string {
  if (
    file.type ===
    'image/png'
  ) {
    return 'png';
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp';
  }

  return 'jpg';
}

function createUniqueId():
  string {
  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID();
  }

  return Math.random()
    .toString(36)
    .slice(2);
}