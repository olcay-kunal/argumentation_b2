'use client';

import { useState } from 'react';
import ApiKeyScreen from '../components/ApiKeyScreen';
import ChatApp from '../components/ChatApp';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);

  if (!isKeyValid) {
    return (
      <main className="app-container">
        <ApiKeyScreen 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          onValid={() => setIsKeyValid(true)} 
        />
      </main>
    );
  }

  return <ChatApp apiKey={apiKey} />;
}
