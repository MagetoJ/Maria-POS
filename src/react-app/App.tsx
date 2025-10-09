import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { POSProvider } from "@/react-app/contexts/POSContext";
import HomePage from "@/react-app/pages/Home";

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
