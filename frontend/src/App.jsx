import Footer from './Components/Footer/Footer';
import NavigationBar from './Components/Navbar/Navbar'
import DBGrid from './Components/Datagrid/DatabaseGrid'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useState } from 'react';
import ChatContainer from './Components/ChatInterface/ChatInterface';
import './App.css'; // Import the new CSS

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <>
      <SignedIn>
        <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="app-wrapper">
          <div className="app-content">
            {activeTab === "dashboard" && <DBGrid />}
            {activeTab === "chat" && <ChatContainer />}
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
