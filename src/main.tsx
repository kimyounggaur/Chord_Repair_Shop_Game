import React from 'react';
import {createRoot} from 'react-dom/client';
import {Runtime} from './app/runtime';
createRoot(document.getElementById('root')!).render(<React.StrictMode><Runtime/></React.StrictMode>);
