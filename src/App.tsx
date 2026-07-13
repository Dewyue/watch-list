import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import BatchEnrichRunner from './components/BatchEnrichRunner'
import OthersPage from './pages/OthersPage'
import SectionPage from './pages/SectionPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-[430px] flex-col">
      <main className="flex-1 px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/watching" replace />} />
          <Route path="/watching" element={<SectionPage sectionKey="watching" />} />
          <Route path="/urgent" element={<SectionPage sectionKey="urgent" />} />
          <Route path="/unfinished" element={<SectionPage sectionKey="unfinished" />} />
          <Route path="/todo" element={<SectionPage sectionKey="todo" />} />
          <Route path="/others" element={<OthersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <BottomNav />
      <BatchEnrichRunner />
    </div>
  )
}
