import { useState } from 'react';
import './App.css';
import BatchList from './components/BatchList';
import CreateBatchForm from './components/CreateBatchForm';
import PosScreen from './components/PosScreen';
import Dashboard from './components/Dashboard'; // استيراد لوحة التحكم

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // جعل لوحة التحكم هي الشاشة الافتراضية

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>مشتلة الفردوس</h1>
        <nav>
          <button onClick={() => setCurrentView('dashboard')}>لوحة التحكم</button>
          <button onClick={() => setCurrentView('list')}>عرض المخزون</button>
          <button onClick={() => setCurrentView('create')}>إنشاء دفعة جديدة</button>
          <button onClick={() => setCurrentView('pos')}>نقطة البيع (POS)</button>
        </nav>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'list' && <BatchList />}
        {currentView === 'create' && <CreateBatchForm />}
        {currentView === 'pos' && <PosScreen />}
      </main>

      <footer className="app-footer">
        <p>جميع الحقوق محفوظة لمشتلة الفردوس &copy; 2024</p>
      </footer>
    </div>
  );
}

export default App;