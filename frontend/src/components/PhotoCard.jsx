const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function PhotoCard({ photo, selected, onSelect }) {
  const {
    filename,
    originalName,
    type,
    size,
    createdAt,
    originalUrl,
    thumbnailUrl,
  } = photo;

  // Sise of FILE 
  function formatSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
  }

  // Date format 
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Fallback for broken image
  function handleImageError(event) {
    // Show placeholder 
    event.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect fill='%23e0e0e0' width='500' height='500'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo thumbnail%3C/text%3E%3C/svg%3E";
  }

  return (
    <div
      className={`photo-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(filename)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(filename);
        }
      }}
    >
      <div className="photo-wrapper">
        <img
          src={`${API_URL}${thumbnailUrl}`}
          alt={originalName || filename}
          loading="lazy"
          onError={handleImageError}
        />

        {/* Badge for wideo */}
        {type === "video" && (
          <div className="video-badge" title="Video">
            ▶
          </div>
        )}

        {/* Checkbox */}
        <div className="photo-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(filename)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${originalName || filename}`}
          />
        </div>

        {/* Overlay z info po hover */}
        <div className="photo-overlay">
          <div className="photo-info">
            <span className="photo-name" title={originalName || filename}>
              {originalName || filename}
            </span>
            <span className="photo-meta">
              {type === "video" ? "🎬" : "📷"} {formatSize(size)} • {formatDate(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoCard;