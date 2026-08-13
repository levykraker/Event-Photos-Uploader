import { useRef, useState } from "react";

const API_URL = "http://localhost:3000";

function UploadZone({ onUploadComplete }) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFiles(event) {
    const files = Array.from(event.target.files);

    if (files.length === 0) {
      return;
    }

    uploadFiles(files);

    // Pozwala wybrać ponownie te same pliki
    event.target.value = "";
  }

  function uploadFiles(files) {
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("photos", file);
    });

    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_URL}/api/photos`);

    // ---------------------------------------------
    // Postęp uploadu
    // ---------------------------------------------

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round(
          (event.loaded / event.total) * 100
        );

        setProgress(percent);
      }
    });

    // ---------------------------------------------
    // Sukces
    // ---------------------------------------------

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);

        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 500);

        onUploadComplete();
      } else {
        try {
          const response = JSON.parse(xhr.responseText);

          setError(
            response.error || "Upload nie powiódł się."
          );
        } catch {
          setError("Upload nie powiódł się.");
        }

        setUploading(false);
      }
    });

    // ---------------------------------------------
    // Błąd połączenia
    // ---------------------------------------------

    xhr.addEventListener("error", () => {
      setError(
        "Nie udało się połączyć z serwerem."
      );

      setUploading(false);
    });

    xhr.send(formData);
  }

  return (
    <div className="upload-zone">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={handleFiles}
        hidden
      />

      <button
        className="upload-button"
        onClick={openFilePicker}
        disabled={uploading}
      >
        {uploading
          ? `Sending... ${progress}%`
          : "＋ Add photos"}
      </button>

      {uploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default UploadZone;