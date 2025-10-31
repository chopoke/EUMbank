import { useState } from 'react';

const AccordionItem = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className={`faq-icon ${isOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="faq-answer">{children}</div>}
        </div>
    );
};

export default AccordionItem;