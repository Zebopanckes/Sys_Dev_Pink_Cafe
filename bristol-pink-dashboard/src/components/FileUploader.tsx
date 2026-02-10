import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { SalesRecord } from '../types';
import { parseCSVFile } from '../services/csvParser';

interface FileUploaderProps {
  onFileLoaded: (records: SalesRecord[]) => void;
}

export function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const records = await parseCSVFile(file);
      if (records.length === 0) {
        setError('No valid records found in the CSV file.');
        return;
      }
      onFileLoaded(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragging ? '#e91e63' : '#ddd'}`,
        borderRadius: 12,
        padding: '1rem',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragging ? '#fce4ec' : '#fff',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {isLoading ? (
        <p style={{ color: '#666' }}>Parsing file...</p>
      ) : fileName ? (
        <p style={{ color: '#333' }}>Loaded: <strong>{fileName}</strong></p>
      ) : (
        <div>
          <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
            Drag & drop a CSV file here, or click to browse
          </p>
          <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
            Expected format: Date, Product, Units Sold
          </p>
        </div>
      )}
      {error && <p style={{ color: '#d32f2f', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
