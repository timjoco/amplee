// main.tsx
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { IonApp, setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/typography.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { supabase } from './lib/supabase';
import './theme/amplee.css';
import './theme/variables.css';

import MobileBottomNav from './components/Nav/MobileBottomNav';

setupIonicReact();

CapApp.addListener('appUrlOpen', async ({ url }) => {
  if (url?.startsWith('app.amplee://auth/callback')) {
    try {
      await Browser.close();
    } catch {}
    await supabase.auth.getSession();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IonApp>
      <BrowserRouter>
        <App />
        {/* Fixed bottom nav, no FAB */}
        <MobileBottomNav />
      </BrowserRouter>
    </IonApp>
  </React.StrictMode>
);
