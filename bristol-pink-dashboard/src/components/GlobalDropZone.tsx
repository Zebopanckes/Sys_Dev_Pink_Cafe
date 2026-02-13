import { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

interface GlobalDropZoneProps {
  onFile: (file: File) => void;
  children: React.ReactNode;
}

export function GlobalDropZone({ onFile, children }: GlobalDropZoneProps) {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter += 1;
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter -= 1;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        onFile(dt.files[0]);
        dt.clearData();
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
  }, [onFile]);

  return (
    <div style={{ minHeight: '100vh' }}>
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
