import React, { useEffect, useState } from 'react';
import './FAQPage.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import API_BASE_URL from '../config';

const FAQPage = () => {
    const [categories, setCategories] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [catRes, faqRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/faqcategories`),
                    fetch(`${API_BASE_URL}/faqs`),
                ]);
                const categoriesData = await catRes.json();
                const faqsData = await faqRes.json();
                setCategories(categoriesData);
                setFaqs(faqsData);
            } catch (err) {
                setError('Failed to load FAQs.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
    };

    const filteredFaqs =
        activeTab === 'all'
            ? faqs
            : faqs.filter((faq) => String(faq.category) === String(activeTab));

    // Only show categories which have at least one FAQ
    const categoriesWithFaqs = categories.filter(cat =>
        faqs.some(faq => String(faq.category) === String(cat.id))
    );

    return (
        <div className="faq-page-container my-4">
            <h1 className="faq-title">Frequently Asked Questions</h1>
            <div className="faq-tabs styled">
                <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => handleTabClick('all')}
                >
                    All
                </button>
                {categoriesWithFaqs.map((cat) => (
                    <button
                        key={cat.id}
                        className={String(activeTab) === String(cat.id) ? 'active' : ''}
                        onClick={() => handleTabClick(cat.id)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="faq-content">
                {loading ? (
                    <div className="faq-loading">Loading...</div>
                ) : error ? (
                    <div className="faq-error">{error}</div>
                ) : filteredFaqs.length === 0 ? (
                    <div className="faq-empty">No FAQs found for this category.</div>
                ) : (
                    <Accordion faqs={filteredFaqs} />
                )}
            </div>
        </div>
    );
};

const Accordion = ({ faqs }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="faq-accordion modern">
            {faqs.map((faq, idx) => (
                <div className={`faq-item modern${openIndex === idx ? ' open' : ''}`} key={faq.id}>
                    <div className="faq-question-row" onClick={() => toggle(idx)}>
                        <span className="faq-question-text">{faq.title}</span>
                        <span className="faq-icon">{openIndex === idx ? <FaChevronUp /> : <FaChevronDown />}</span>
                    </div>
                    <div
                        className={`faq-answer${openIndex === idx ? ' show' : ''}`}
                        style={{ maxHeight: openIndex === idx ? '500px' : '0', opacity: openIndex === idx ? 1 : 0, padding: openIndex === idx ? '1rem' : '0 1rem', transition: 'all 0.3s' }}
                        aria-hidden={openIndex !== idx}
                    >
                        <span dangerouslySetInnerHTML={{ __html: faq.description }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FAQPage;
