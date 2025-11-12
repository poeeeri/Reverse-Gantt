import React, { useState } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

function App() {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="App">
            {isLogin ? (
                <Login onToggleForm={toggleForm} />
            ) : (
                <Register onToggleForm={toggleForm} />
            )}
        </div>
    );
}

export default App;