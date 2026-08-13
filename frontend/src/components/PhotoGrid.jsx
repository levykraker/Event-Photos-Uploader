import PhotoCard from "./PhotoCard";

function PhotoGrid({ photos, selectedPhotos, onSelect }) {
  if (photos.length === 0) {
    return (
      <div className="empty-state">
        <p>No photos added yet.</p>
      </div>
    );
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.filename}
          photo={photo}
          selected={selectedPhotos.has(photo.filename)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default PhotoGrid;