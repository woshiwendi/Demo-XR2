// css stylesheets
import './assets/css/load.css';  
import './assets/css/utils.css';  
import './assets/css/vars/_fonts.css';  
import './assets/css/vars/_theme.css';
import '@xyflow/react/dist/style.css';

import './assets/css/form.css';
import './assets/css/vars/_nav.css';

// pages
import Playground from './playground';
import XRPlayground from './xr_playground';

// custom imports
import './icons';
import { getTheme } from './utils';
import reportWebVitals from './reportWebVitals';
import { themeContextType, themeType } from './types';

// third party
import ReactDOM from 'react-dom/client';
import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
export const ThemeContext = React.createContext<themeContextType | null>(null);

function Sponj3d() {
  const [theme, setTheme] = useState<themeType>(getTheme())

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    setTheme(getTheme())
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Canvas
        shadows
        gl={{ alpha: true }}
        style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'transparent' }}
      >
        <XR>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<XRPlayground />} />
              {/* 其他路由也可以放这 */}
            </Routes>
          </BrowserRouter>
        </XR>
      </Canvas>
    </ThemeContext.Provider>
  )
}

root.render(
  // <React.StrictMode>
    <Sponj3d />
  // </React.StrictMode>
);

reportWebVitals();
