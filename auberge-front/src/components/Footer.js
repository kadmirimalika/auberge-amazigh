import React from 'react';

const Footer = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-info">
          <p>&copy; 2025 Auberge Amazigh. All rights reserved.</p>
          <p>Location: Douar Ait Ayoub, Barrage Allal El Fassi, 31000</p>
          <p>Follow us on social media!</p>
        </div>
        <div className="footer-map">
          <iframe
            title="Auberge Amazigh Location"
            src="https://www.google.com/maps?q=Douar+Ait+Ayoub,+Barrage+Allal+El+Fassi,+31000&output=embed"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
