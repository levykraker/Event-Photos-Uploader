import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UploadZone({ onUploadComplete, onUploadStart, onUploadEnd }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(event) {
    const files = Array.from(event.target.files);

    if (files.length === 0) {
      return;
    }

    // Debug MIME types
    console.log("📤 Files to upload:", files.map(f => ({
      name: f.name,
      type: f.type || "⚠️ empty MIME",
      size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
      extension: f.name.split('.').pop().toLowerCase(),
    })));

    uploadFiles(files);
    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }

  function uploadFiles(files) {
    setUploading(true);
    setProgress(0);
    setError(null);
    onUploadStart?.();

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("photos", file);
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/photos`);
    xhr.timeout = 300000;

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          onUploadEnd?.();
        }, 500);
        onUploadComplete();
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          setError(response.error || "Upload failed.");
        } catch {
          setError(`Upload failed (HTTP ${xhr.status})`);
        }
        setUploading(false);
        onUploadEnd?.();
      }
    });

    xhr.addEventListener("error", () => {
      setError("Cannot connect to server.");
      setUploading(false);
      onUploadEnd?.();
    });

    xhr.addEventListener("timeout", () => {
      setError("Upload timeout - files are too large.");
      setUploading(false);
      onUploadEnd?.();
    });

    xhr.send(formData);
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFiles}
        hidden
      />

      <button
        className="upload-button"
        onClick={openFilePicker}
        disabled={uploading}
      >
        {uploading ? `Sending... ${progress}%` : "＋ Add photos"}
      </button>

      {uploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="upload-error" role="alert">
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default UploadZone;