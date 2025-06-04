import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; // adjust path if necessary
import headerBg from '../assets/header-background.jpg';

const Header = () => {
  return (
    <header
    className="header"
    style={{
      backgroundImage: `url(${headerBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}
  >
      <div className="logo-container">
        <img src={logo} alt="Auberge Amazigh Logo" />
      </div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><Link to="/reservation">Reservation</Link></li>
          <li><Link to="/adminlogin">Admin Login</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
