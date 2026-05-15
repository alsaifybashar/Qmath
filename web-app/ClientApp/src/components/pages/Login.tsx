import React from 'react';
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
    const { login } = useAuth();

    const handleGoogleLogin = () => {
        // Handle Google OAuth login here
        console.log('Google login clicked');
        login();
    };

    return (
        <div className="container">
            <div className="left-side">
                <div className="top-text animated-text">Welcome to Qmath</div>
                <div className="bottom-text animated-text">Let's get started</div>
            </div>
            <div className="right-side">
                <button className="google-button" onClick={handleGoogleLogin}>Login with Google</button>
                <button className="google-button">SSO Login</button>
            </div>
            <style>
                {`
                .container {
                    display: flex;
                    height: 100vh;
                    border: 2px solid red;
                }

                .left-side {
                    flex: 1;
                    background-color: black;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    width: 50%;
                }

                .right-side {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 50%;
                }

                @keyframes slideInFromTop {
                    0% {
                        transform: translateY(-100%);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }

                @keyframes slideInFromBottom {
                    0% {
                        transform: translateY(100%);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }

                .animated-text {
                    position: absolute;
                    font-size: 2rem;
                }

                .top-text {
                    top: 0;
                    animation: slideInFromTop 2.5s forwards;
                }

                .bottom-text {
                    bottom: 0;
                    animation: slideInFromBottom 2.5s forwards;
                    animation-delay: 2.5s;
                }

                .google-button {
                    padding: 10px 20px;
                    font-size: 1rem;
                    cursor: pointer;
                }
                `}
            </style>
        </div>
    );
};

export default Login;