import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './index.scss'
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/AppHeader";
import DashboardPage from './pages/dashboard/DashboardPage';

const App: React.FC = () => {

  return (
    <main className='App'>
        <Sidebar />
        <Header />
        <DashboardPage />
        <Toast />
    </main>
  )
};

export default App;
