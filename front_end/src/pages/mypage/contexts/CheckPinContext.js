// contexts/CheckPinContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkPinNumber } from '../../../pages/account/api/accountApi';

const CheckPinContext = createContext();

export const CheckPinProvider = ({ children }) => {
    const [checkPin, setCheckPin] = useState('');

    useEffect(() => {
        const checkPinFunction = async () => {
            try {
                const verifyRes = await checkPinNumber();

                if (verifyRes?.ok) {
                    console.log("성공했다.");
                    setCheckPin(verifyRes?.state);
                } else {
                    console.log("실패했다.");
                    setCheckPin(verifyRes?.state);
                }
            } catch (error) {
                setCheckPin(false);
                console.log(error);
            }
        };
        checkPinFunction();
    }, []);

    return (
        <CheckPinContext.Provider value={{ checkPin, setCheckPin }}>
            {children}
        </CheckPinContext.Provider>
    );
};

// Custom Hook for easy access
export const useCheckPin = () => {
    const context = useContext(CheckPinContext);
    if (!context) {
        throw new Error('useCheckPin must be used within CheckPinProvider');
    }
    return context;
};