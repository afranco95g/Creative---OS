'use client';

import {
  type ChangeEvent,
  useState,
} from 'react';

import {
  uploadExperienceImage,
} from '../../services/agenda/experienceImageService';

interface ExperienceImageUploadProps {
  value: string;
  onChange: (
    imageUrl: string
  ) => void;
  disabled?: boolean;
}

export function ExperienceImageUpload({
  value,
  onChange,
  disabled = false,
}: ExperienceImageUploadProps) {
  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  async function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const publicUrl =
        await uploadExperienceImage(
          file
        );

      onChange(publicUrl);

      setSuccessMessage(
        'La imagen fue cargada correctamente.'
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsUploading(false);

      /*
       * Permite volver a seleccionar
       * el mismo archivo.
       */
      event.target.value = '';
    }
  }

  return (
    <div>
      <label
        htmlFor="experience-cover-file"
        className="mb-2 block text-sm font-medium text-[#BDBDBD]"
      >
        Imagen de portada
      </label>

      <div className="rounded-2xl border border-dashed border-white/15 bg-[#111111] p-5">
        <input
          id="experience-cover-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            void handleFileChange(
              event
            );
          }}
          disabled={
            disabled ||
            isUploading
          }
          className="block w-full cursor-pointer text-sm text-[#999999] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-5 file:py-3 file:text-sm file:font-bold file:text-black hover:file:bg-[#D9FF00] disabled:opacity-50"
        />

        <p className="mt-3 text-xs leading-5 text-[#666666]">
          Formatos permitidos:
          JPG, PNG y WEBP.
          Peso máximo: 8 MB.
        </p>

        {isUploading ? (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#D9FF00]" />
            </div>

            <p className="mt-3 text-sm text-[#D9FF00]">
              Cargando imagen...
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor="experience-cover-url"
          className="mb-2 block text-xs text-[#777777]"
        >
          También puedes pegar una URL
        </label>

        <input
          id="experience-cover-url"
          type="url"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          disabled={
            disabled ||
            isUploading
          }
          placeholder="https://..."
          className="w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00] disabled:opacity-50"
        />
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {value ? (
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#080808]">
          <img
            src={value}
            alt="Vista previa de la actividad"
            className="aspect-[16/9] w-full object-cover"
          />

          <div className="flex items-center justify-between gap-4 p-4">
            <p className="min-w-0 truncate text-xs text-[#777777]">
              Imagen cargada
            </p>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuccessMessage('');
                setErrorMessage('');
              }}
              disabled={
                disabled ||
                isUploading
              }
              className="shrink-0 rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-300 disabled:opacity-50"
            >
              Quitar imagen
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado al cargar la imagen.';
}