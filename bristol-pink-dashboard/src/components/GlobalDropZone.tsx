import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../ThemeContext';

interface GlobalDropZoneProps {
  onFile: (file: File) => void;
  onReject?: (reason: string, file?: File) => void;
  children: React.ReactNode;
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return true;
  const type = (file.type || '').toLowerCase();
  return type === 'text/csv' || type === 'application/vnd.ms-excel';
}

export function GlobalDropZone({ onFile, onReject, children }: GlobalDropZoneProps) {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter += 1;
      // Only show overlay when actual files are being dragged
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (hasFiles) setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter -= 1;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter = 0;
      const dt = e.dataTransfer;
      // eslint-disable-next-line no-console
      console.log('[DropZone] drop event', {
        hasDT: !!dt,
        fileCount: dt?.files?.length ?? 0,
        types: dt ? Array.from(dt.types) : [],
      });
      if (dt && dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        if (!isCsvFile(file)) {
          onReject?.(`"${file.name}" is not a CSV file. Please drop a .csv file.`, file);
        } else {
          onFile(file);
        }
        dt.clearData();
      } else {
        onReject?.('No file detected in drop. If using VS Code Simple Browser, open the dashboard in Chrome/Edge instead, or use the "Upload CSV" button.');
      }
    };

    window.addEventListener('dragenter', handleDragEnter as EventListener);
    window.addEventListener('dragleave', handleDragLeave as EventListener);
    window.addEventListener('dragover', handleDragOver as EventListener);
    window.addEventListener('drop', handleDrop as EventListener);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter as EventListener);
      window.removeEventListener('dragleave', handleDragLeave as EventListener);
      window.removeEventListener('dragover', handleDragOver as EventListener);
      window.removeEventListener('drop', handleDrop as EventListener);
    };
  }, [onFile, onReject]);

  const handlePickedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!isCsvFile(file)) {
      onReject?.(`"${file.name}" is not a CSV file. Please choose a .csv file.`, file);
    } else {
      onFile(file);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          handlePickedFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload CSV file"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9998,
          padding: '0.55rem 0.9rem',
          backgroundColor: '#e91e63',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85rem',
          boxShadow: '0 4px 14px rgba(233,30,99,0.4)',
        }}
      >
        Upload CSV
      </button>
      {children}
      {isDragging && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: theme.dropOverlay,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: '#fff',
          pointerEvents: 'none',
        }}>
          <div style={{
            textAlign: 'center',
            pointerEvents: 'none',
            backgroundColor: 'rgba(233,30,99,0.15)',
            border: '2px dashed rgba(233,30,99,0.6)',
            borderRadius: 16,
            padding: '2rem 3rem',
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Drop CSV to upload</div>
            <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>Releasing will load the file into the app</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalDropZone;
