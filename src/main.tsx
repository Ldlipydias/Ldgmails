import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Main.tsx starting...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Root element not found!");
  }
  
  console.log("Creating React root...");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("React root rendered.");
} catch (err) {
  console.error("CRITICAL ERROR during app initialization:", err);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Erro Crítico</h1>
      <p>O aplicativo falhou ao iniciar.</p>
      <pre>${err instanceof Error ? err.message : String(err)}</pre>
    </div>
  `;
}
