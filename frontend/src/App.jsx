import Footer from './Components/Footer/Footer';
import NavigationBar from './Components/Navbar/Navbar'
import DBGrid from './Components/Datagrid/DatabaseGrid'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ChatContainer from './Components/ChatInterface/ChatInterface';
import APIKeyManager from './Components/ApiKeyManager/ApiKeyManager';
import './App.css'; 

function App() {

  return (
    <>
      <SignedIn>
        <NavigationBar />
        <div className="app-wrapper">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<DBGrid />}/>
              <Route path="/chat" element={<ChatContainer />}/>
              <Route path="/key" element={<APIKeyManager />}/>
            </Routes>
          </div>
          <Footer />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default App;
