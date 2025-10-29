import AccordionItem from './AccordionItem';

const FAQSection = ({ faqs }) => {
    return (
        <section className="info-section">
            <h3>FAQ</h3>
            <div className="faq-list">
                {faqs.map(faq => (
                    <AccordionItem key={faq.q} title={faq.q}>
                        <p>{faq.a}</p>
                    </AccordionItem>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;