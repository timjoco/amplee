import { IonApp, setupIonicReact } from '@ionic/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
// REMOVE: import { IonReactRouter } from '@ionic/react-router';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { supabase } from './lib/supabase';
import './theme/amplee.css';

import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

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
      </BrowserRouter>
    </IonApp>
  </React.StrictMode>
);
