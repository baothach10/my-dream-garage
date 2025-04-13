import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App';
import { AssetLoaderProvider } from './context/AssetLoaderContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    // <React.StrictMode>
        <AssetLoaderProvider><App /></AssetLoaderProvider>
    // </React.StrictMode>
);
