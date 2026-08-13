import { useEffect, useState } from "react";
import PhotoGrid from "./components/PhotoGrid";
import UploadZone from "./components/UploadZone";
import "./App.css";

const API_URL = "http://localhost:3000";

function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------------------------
  // Download photos
  // ---------------------------------------------

  async function loadPhotos() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/photos`
      );

      if (!response.ok) {
        throw new Error("Error, can't download photos.");
      }

      const data = await response.json();

      setPhotos(data);
    } catch (error) {
      console.error(error);
      setError("Error cannot connect to server.");
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
  // Mark photos
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
  // Mark all 
  // ---------------------------------------------

  function selectAll() {
    setSelectedPhotos(
      new Set(photos.map((photo) => photo.filename))
    );
  }

  // ---------------------------------------------
  //  Zip function
  // ---------------------------------------------
  async function downloadSelected() {
  if (selectedPhotos.size === 0) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/photos/download`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          filenames: Array.from(selectedPhotos),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Error, issue with downloading photos."
      );
    }

    // Save response as Blob
    const blob = await response.blob();

    // Temporary url
    const url = window.URL.createObjectURL(blob);

    // Create invisible link
    const link = document.createElement("a");

    link.href = url;
    link.download = `${import.meta.env.VITE_ZIP_NAME}.zip`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

  } catch (error) {
    console.error(error);

    alert(
      "Error with downloading photos."
    );
  }
}

  // ---------------------------------------------
  // Mark all
  // ---------------------------------------------

  function deselectAll() {
    setSelectedPhotos(new Set());
  }

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="app">
        <p>Loading photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <p>{error}</p>
      </div>
    );
  }

  const allSelected =
    photos.length > 0 &&
    selectedPhotos.size === photos.length;

  const event_name=import.meta.env.VITE_EVENT_NAME;
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{event_name}</h1>

          <p className="subtitle">
            {photos.length} photos
          </p>
        </div>

       <div className="actions">
          <UploadZone onUploadComplete={loadPhotos} />

          {allSelected ? (
            <button onClick={deselectAll}>
              Uncheck all
            </button>
          ) : (
            <button onClick={selectAll}>
              Mark all
            </button>
          )}

          <button
            onClick={downloadSelected}
            disabled={selectedPhotos.size === 0}
          >
            ↓ Download ({selectedPhotos.size})
          </button>

          <span className="selected-count">
            Marked: {selectedPhotos.size}
          </span>
        </div>
      </header>

      <main>
        <PhotoGrid
          photos={photos}
          selectedPhotos={selectedPhotos}
          onSelect={handleSelect}
        />
      </main>
    </div>
  );
}

export default App;