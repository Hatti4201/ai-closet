import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PanelLayout from './components/PanelLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomeAIControlPanel from './pages/HomeAIControlPanel';
import WardrobePage from './pages/WardrobePage';
import UploadClothingPage from './pages/UploadClothingPage';
import ClothingDetailPage from './pages/ClothingDetailPage';
import RecommendationPage from './pages/RecommendationPage';
import LookDetailPage from './pages/LookDetailPage';
import CreateLookPage from './pages/CreateLookPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          {/* AI Panel — full-height, no max-width padding */}
          <Route element={<PanelLayout />}>
            <Route path="/home" element={<HomeAIControlPanel />} />
          </Route>

          {/* Standard pages */}
          <Route element={<Layout />}>
            <Route path="/wardrobe" element={<WardrobePage />} />
            <Route path="/upload" element={<UploadClothingPage />} />
            <Route path="/clothing/:id" element={<ClothingDetailPage />} />
            <Route path="/clothing/:id/edit" element={<ClothingDetailPage />} />
            <Route path="/recommendations" element={<RecommendationPage />} />
            <Route path="/looks/create" element={<CreateLookPage />} />
            <Route path="/looks/:id" element={<LookDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
