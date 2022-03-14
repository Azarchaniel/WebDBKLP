import React from 'react';
import 'react-confirm-alert/src/react-confirm-alert.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.scss'
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

const App: React.FC = () => {

  return (
    <main className='App'>
        <Sidebar />
        <Header />
        <div className='futureReports'>Here shall be reports, numbers, graphs etc.</div>
        <Toast />
    </main>
  )
};

export default App;
