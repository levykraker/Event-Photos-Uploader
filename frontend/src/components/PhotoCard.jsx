function PhotoCard({ photo, selected, onSelect }) {
  return (
    <div
      className={`photo-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(photo.filename)}
    >
      <img
        src={`http://localhost:3000${photo.thumbnailUrl}`}
        alt={photo.filename}
        loading="lazy"
      />

      <div className="photo-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(photo.filename)}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}

export default PhotoCard;