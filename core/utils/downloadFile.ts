export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string
) {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
}