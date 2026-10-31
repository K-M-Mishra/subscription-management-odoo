import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
<<<<<<< HEAD
import './style.css'; // Yahan 'styles.css' ko 'style.css' kar diya gaya hai
=======
import "./index.css"; // ya jo bhi aapki css file ka naam hai
import "./styles.css";
>>>>>>> 64d2513474b7e95886aeb1001ce73a4a4f8231b7

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
