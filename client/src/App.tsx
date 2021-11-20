import React from 'react';
import 'react-confirm-alert/src/react-confirm-alert.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.scss'
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import {Link} from "react-router-dom";

const App: React.FC = () => {

  return (
    <main className='App'>
        <Sidebar />
        <h1><Link className='customLink' to='/'>WebDBKLP</Link></h1>
        <div className='futureReports'>Here shall be reports, numbers, graphs etc.</div>
        <Toast />
    </main>
  )
};

export default App;
