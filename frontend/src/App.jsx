import { useEffect, useState } from "react";
import PhotoGrid from "./components/PhotoGrid";
import UploadZone from "./components/UploadZone";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // ---------------------------------------------
  // Load photos
  // ---------------------------------------------
  async function loadPhotos() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/photos`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error("❌ Load photos error:", error);

      if (error.name === "TimeoutError") {
        setError("Connection timeout - server is not responding.");
      } else {
        setError(`Cannot load photos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------
  // Start
  // ---------------------------------------------
  useEffect(() => {
    loadPhotos();
  }, []);

  // ---------------------------------------------
  // Select photo
  // ---------------------------------------------
  function handleSelect(filename) {
    setSelectedPhotos((previous) => {
      const next = new Set(previous);

      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }

      return next;
    });
  }

  // ---------------------------------------------
  // Select all
  // ---------------------------------------------
  function selectAll() {
    setSelectedPhotos(new Set(photos.map((photo) => photo.filename)));
  }

  // ---------------------------------------------
  // Deselect all
  // ---------------------------------------------
  function deselectAll() {
    setSelectedPhotos(new Set());
  }

  // ---------------------------------------------
  // Download selected as ZIP
  // ---------------------------------------------
  async function downloadSelected() {
    if (selectedPhotos.size === 0) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/photos/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filenames: Array.from(selectedPhotos),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${import.meta.env.VITE_ZIP_NAME || "photos"}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("❌ Download error:", error);
      alert(`Download failed: ${error.message}`);
    }
  }

  // ---------------------------------------------
  // Handle upload start/end
  // ---------------------------------------------
  function handleUploadStart() {
    setUploading(true);
  }

  function handleUploadEnd() {
    setUploading(false);
  }

  // ---------------------------------------------
  // Retry loading
  // ---------------------------------------------
  function handleRetry() {
    loadPhotos();
  }

  // ---------------------------------------------
  // Render: Loading
  // ---------------------------------------------
  if (loading) {
    return (
      <div className="app app-loading">
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Loading photos...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Render: Error
  // ---------------------------------------------
  if (error) {
    return (
      <div className="app app-error">
        <div className="error-box">
          <h2>⚠️ Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            🔄 Try again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Render: Main
  // ---------------------------------------------
  const allSelected = photos.length > 0 && selectedPhotos.size === photos.length;
  const event_name = import.meta.env.VITE_EVENT_NAME || "Event";

  return (
    <div className="app">
      <header className="header">
        <div className="header-info">
          <h1>{event_name}</h1>
          <p className="subtitle">
            {photos.length} {photos.length === 1 ? "photo" : "photos"}
          </p>
        </div>

        <div className="actions">
          <UploadZone
            onUploadComplete={loadPhotos}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
          />

          {photos.length > 0 && (
            <>
              {allSelected ? (
                <button onClick={deselectAll} className="btn-secondary">
                  Uncheck all
                </button>
              ) : (
                <button onClick={selectAll} className="btn-secondary">
                  Mark all
                </button>
              )}

              <button
                onClick={downloadSelected}
                disabled={selectedPhotos.size === 0}
                className="btn-primary"
              >
                ↓ Download ({selectedPhotos.size})
              </button>

              <span className="selected-count">
                Marked: {selectedPhotos.size}
              </span>
            </>
          )}
        </div>
      </header>

      {uploading && (
        <div className="uploading-overlay">
          <div className="uploading-spinner">
            <div className="spinner" />
            <p>Uploading photos...</p>
          </div>
        </div>
      )}

      <main>
        {photos.length === 0 ? (
          <div className="empty-state">
            <p>📷 No photos yet</p>
            <p className="empty-hint">Upload your first photos above</p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            selectedPhotos={selectedPhotos}
            onSelect={handleSelect}
          />
        )}
      </main>
    </div>
  );
}

export default App;