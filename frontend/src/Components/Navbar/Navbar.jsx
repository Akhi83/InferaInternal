import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Sun, Moon } from 'lucide-react';
import './NavigationBar.css';

const tabs = ["DASHBOARD", "CHAT", "API"];

function NavigationBar({ activeTab, onTabChange }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <Navbar 
      expand="lg" 
      className="custom-navbar shadow-sm"
      variant="dark"
      sticky="top"
    >
      <Container fluid className="px-4">
        <Navbar.Brand 
          href="#home" 
          className="brand-logo fw-bold fs-3 text-gradient"
        >
          <img className='light'
            src="\src\Assets\Emergeflow logo-transparent 6.png"
            alt="Logo" 
            height="40" 
            style={{ objectFit: 'contain' }}
          />
          <img className='dark'
            src="\src\Assets\Emergeflow white logo.png"
            alt="Logo" 
            height="40" 
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand> 
        <SignedIn>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="custom-toggler border-0" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav 
            className="mx-auto nav-pills-custom" 
            activeKey={activeTab} 
            onSelect={(selectedKey) => onTabChange(selectedKey)}
          >
            {tabs.map((tab, index) => (
              <Nav.Link 
                key={index} 
                eventKey={tab.toLowerCase()} 
                href={`#${tab.toLowerCase()}`}
                className="nav-item-custom mx-2 px-4 py-2 rounded-pill"
              >
                {tab}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
        </SignedIn>

        {/* Right Side: Theme Toggle + Auth */}
        <div className="auth-section d-flex align-items-center ms-auto">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <SignedOut>
            <div className="signin-wrapper">
              <SignInButton className="btn-signin" />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="user-button-wrapper">
              <UserButton appearance={{ elements: { avatarBox: "user-avatar-custom" } }} />
            </div>
          </SignedIn>
        </div>
      </Container>  
    </Navbar>
  );
}

export default NavigationBar;
