// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './neonTheme.css'; 
import './3dCards.css'; 
import './metallicStyles.css';

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function() {};
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);