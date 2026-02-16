import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const filteredFaqs = t.faq.questions.filter(
    (faq: { q: string; a: string }) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <SEO
      title="FAQ | Triple J Auto Investment Houston | Common Questions"
      description="Answers to common questions about buying used cars at Triple J Auto Investment in Houston. AS-IS sales policy, financing, trade-ins, title transfer, and payment options."
      path="/faq"
    />
    <div className="min-h-screen bg-black pt-40 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-16 border-b border-white/10 pb-12">
          <div className="inline-flex items-center gap-2 mb-6 text-tj-gold text-xs uppercase tracking-[0.4em]">
            <HelpCircle size={16} />
            <span>{t.faq.badge}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6">
            {t.faq.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            {t.faq.subtitle}
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.faq.searchPlaceholder}
              className="w-full bg-tj-dark border border-white/10 pl-12 pr-4 py-4 text-white focus:border-tj-gold outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
            />
          </div>
        </div>

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {t.faq.noResults} "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-4" role="list">
            {filteredFaqs.map((faq: { q: string; a: string }, idx: number) => {
              const isOpen = openIndex === idx;

              return (
                <div key={idx} className="bg-tj-dark border border-white/10 overflow-hidden hover:border-tj-gold/30 transition-colors" role="listitem">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    className="w-full text-left p-6 flex justify-between items-center gap-4 group focus:outline-none focus:ring-2 focus:ring-tj-gold focus:ring-offset-2 focus:ring-offset-black"
                  >
                    <h3 className="text-white font-medium text-lg group-hover:text-tj-gold transition-colors">
                      {faq.q}
                    </h3>
                    <ChevronDown
                      size={20}
                      className={`text-tj-gold transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-tj-gold/10 border border-tj-gold/30 p-6 md:p-8 text-center mt-16">
          <h3 className="text-white font-display text-2xl mb-4">{t.faq.stillHaveQuestions}</h3>
          <p className="text-gray-400 mb-6">
            {t.faq.contactPrompt}
          </p>
          <a
            href="/contact"
            className="inline-block bg-tj-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-tj-gold focus:ring-offset-2 focus:ring-offset-black"
          >
            {t.faq.contactCta}
          </a>
        </div>

      </div>
    </div>
    </>
  );
};

export default FAQ;
