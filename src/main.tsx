
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fix React StrictMode to prevent double invocation of effects
createRoot(document.getElementById("root")!).render(<App />);
