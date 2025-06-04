import React from 'react';

const Gallery = () => {
  return (
    <div className="gallery">
      <h2>Our Gallery</h2>
      <div>
        <img src="/assets/room1.jpg" alt="Room 1" />
        <img src="/assets/room2.jpg" alt="Room 2" />
        {/* Add more images */}
      </div>
    </div>
  );
};

export default Gallery;
