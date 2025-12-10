// main.tsx
import { App as CapApp } from '@capacitor/app';
import { Browser as CapBrowser } from '@capacitor/browser';
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

// Auth callback deep link
CapApp.addListener('appUrlOpen', async ({ url }) => {
  if (url?.startsWith('app.amplee://auth/callback')) {
    try {
      await CapBrowser.close();
    } catch {}
    await supabase.auth.getSession();
  }
});

// Android hardware back button → go back in history (if possible)
CapApp.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    // At root: you can either do nothing or eventually call CapApp.exitApp()
    // For now, we just ignore it to avoid accidental exits.
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IonApp>
      <BrowserRouter>
        <App />
        <MobileBottomNav />
      </BrowserRouter>
    </IonApp>
  </React.StrictMode>
);
