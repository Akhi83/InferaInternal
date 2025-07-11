import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import './NavigationBar.css'; 

const tabs = ["Dashboard", "Chat"];

function NavigationBar({ activeTab, onTabChange }) {
  return (
    <Navbar 
      expand="lg" 
      className="custom-navbar shadow-lg"
      variant="dark"
      sticky="top"
    >
      <Container fluid className="px-4">
        {/* Left: Brand with enhanced styling */}
        <Navbar.Brand 
          href="#home" 
          className="brand-logo fw-bold fs-3 text-gradient"
        >
          <img 
            src="\src\Assets\Emergeflow logo-transparent 6.png"
            alt="Logo" 
            height="40" 
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>

        {/* Mobile toggle with custom styling */}   
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="custom-toggler border-0"
        />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Center: Enhanced Nav items */}
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
                <span className="nav-icon me-2">
                  {tab === "Dashboard" ? "📊" : "💬"}
                </span>
                {tab}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>

        {/* Right: Enhanced Auth controls */}
        <div className="auth-section d-flex align-items-center ms-auto">
          <SignedOut>
            <div className="signin-wrapper">
              <SignInButton className="btn-signin" />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="user-button-wrapper">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "user-avatar-custom"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </Container>  
    </Navbar>
  );
}

export default NavigationBar;