import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from './contexts/AuthContext';
import { POSProvider } from './contexts/POSContext';
import HomePage from "./pages/Home";

export default function App() {
  return (
    <AuthProvider>
      <POSProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Router>
      </POSProvider>
    </AuthProvider>
  );
}
