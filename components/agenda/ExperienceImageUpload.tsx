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
        className="mb-2 block text-sm font-medium text-texto-largo"
      >
        Imagen de portada
      </label>

      <div className="rounded-2xl border border-dashed border-borde/15 bg-superficie-elevada p-5">
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
          className="block w-full cursor-pointer text-sm text-texto-largo file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-rojo-base file:px-5 file:py-3 file:text-sm file:font-bold file:text-hueso hover:file:bg-rojo-base disabled:opacity-50"
        />

        <p className="mt-3 text-xs leading-5 text-texto-largo">
          Formatos permitidos:
          JPG, PNG y WEBP.
          Peso máximo: 8 MB.
        </p>

        {isUploading ? (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-borde/10">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-rojo-base" />
            </div>

            <p className="mt-3 text-sm text-texto-principal">
              Cargando imagen...
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor="experience-cover-url"
          className="mb-2 block text-xs text-texto-largo"
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
          className="w-full rounded-2xl border border-borde/10 bg-superficie-elevada px-5 py-4 text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento disabled:opacity-50"
        />
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-borde bg-rojo-base px-4 py-3 text-sm text-hueso">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-borde bg-superficie-elevada px-4 py-3 text-sm text-texto-principal">
          {successMessage}
        </div>
      ) : null}

      {value ? (
        <div className="mt-5 overflow-hidden rounded-3xl border border-borde/10 bg-superficie-elevada">
          <img
            src={value}
            alt="Vista previa de la actividad"
            className="aspect-[16/9] w-full object-cover"
          />

          <div className="flex items-center justify-between gap-4 p-4">
            <p className="min-w-0 truncate text-xs text-texto-largo">
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
              className="shrink-0 rounded-full border border-borde px-4 py-2 text-xs font-semibold text-rojo-base disabled:opacity-50"
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