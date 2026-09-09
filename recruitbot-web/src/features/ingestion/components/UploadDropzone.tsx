import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { formatFileSize } from '../utils/fileValidation';

interface UploadDropzoneProps {
  /** Currently selected file (if any), used for the selected-state display. */
  selectedFile: File | null;
  /** Called when the user picks or drops a file. */
  onFileSelected: (file: File) => void;
  /** Disable interaction (e.g. while an upload is in progress). */
  disabled?: boolean;
}

/**
 * UploadDropzone
 *
 * Drag-and-drop target plus click-to-browse. Purely presentational: it
 * reports the chosen file up via onFileSelected and does not validate or
 * upload (validation lives in the parent card / util).
 */
export function UploadDropzone({
  selectedFile,
  onFileSelected,
  disabled = false,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const openFileDialog = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [disabled, onFileSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragActive(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
      // Reset so selecting the same file again still fires change.
      e.target.value = '';
    },
    [onFileSelected]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog]
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload resume PDF. Click to browse or drag and drop a file here."
      aria-disabled={disabled}
      onClick={openFileDialog}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/10'
          : 'border-white/[0.12] bg-bg-card hover:border-primary/60 hover:bg-primary/[0.04]',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      {selectedFile ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <FileText size={24} />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {selectedFile.name}
            </p>
            <p className="text-xs text-text-muted">
              {formatFileSize(selectedFile.size)} · Click to choose a different file
            </p>
          </div>
        </>
      ) : (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UploadCloud size={24} />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {isDragActive ? 'Drop the PDF here' : 'Drag & drop your resume'}
            </p>
            <p className="text-xs text-text-muted">
              or click to browse · PDF only · max 5MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
