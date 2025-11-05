// src/components/ProductTypeToggle/ProductTypeToggle.jsx
import React from 'react';
import '../css/ProductTypeToggle.css';

const ProductTypeToggle = ({ activeType, onToggle }) => {
    return (
        <div className="product-type-toggle">
            <div className="toggle-container">
                <div
                    className={`toggle-option ${activeType === '예금' ? 'active red' : ''}`}
                    onClick={() => onToggle('예금')}
                >
                    <span className="toggle-text">예금</span>
                </div>
                <div
                    className={`toggle-option ${activeType === '적금' ? 'active blue' : ''}`}
                    onClick={() => onToggle('적금')}
                >
                    <span className="toggle-text">적금</span>
                </div>
                <div className={`toggle-slider ${activeType === '적금' ? 'right' : 'left'}`}></div>
            </div>
        </div>
    );
};

export default ProductTypeToggle;