import Footer from './Components/Footer/Footer';
import NavigationBar from './Components/Navbar/Navbar'
import DBGrid from './Components/Datagrid/DatabaseGrid'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useState } from 'react';
import ChatContainer from './Components/ChatInterface/ChatInterface';

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <>
      <SignedIn>
        <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} /> 
        {  activeTab == "dashboard" && <DBGrid />  }
        {  activeTab == "chat" && <ChatContainer /> }
        <Footer />
      </SignedIn>
      <SignedOut> 
          <RedirectToSignIn />
      </SignedOut>
   </>
  )
}

export default App;