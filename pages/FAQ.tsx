import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  const faqs = [
    {
      category: 'PURCHASING',
      questions: [
        {
          q: 'Are all vehicles sold AS-IS?',
          a: 'Yes. Every vehicle is sold AS-IS with no warranties, expressed or implied. We provide full diagnostic disclosure, but post-sale repairs are your responsibility.'
        },
        {
          q: 'Can I return a vehicle after purchase?',
          a: 'No. All sales are final. We encourage thorough inspection before commitment. You may arrange a pre-purchase mechanical inspection at your expense.'
        },
        {
          q: 'Do you accept trades?',
          a: 'Yes. We provide fair market valuations based on real-time auction data. Contact us with your vehicle details for assessment.'
        },
        {
          q: 'What forms of payment do you accept?',
          a: 'Cash, cashier check, wire transfer, and approved financing. Personal checks accepted after clearance (3-5 business days).'
        }
      ]
    },
    {
      category: 'FINANCING',
      questions: [
        {
          q: 'Do you offer in-house financing?',
          a: 'No. We partner with third-party lenders. Financing is subject to credit approval and vehicle eligibility.'
        },
        {
          q: 'What credit score is required?',
          a: 'Minimum 580 for consideration. Prime rates (750+) receive best terms. Higher down payments improve approval odds for lower scores.'
        },
        {
          q: 'How long does approval take?',
          a: 'Pre-qualification: 24-48 hours. Full approval: 3-5 business days once all documentation is submitted.'
        }
      ]
    },
    {
      category: 'TITLE & REGISTRATION',
      questions: [
        {
          q: 'How long does title transfer take?',
          a: 'Texas DMV processing: 14-30 days. We submit all paperwork within 48 hours of sale completion.'
        },
        {
          q: 'Can I drive the vehicle before receiving the title?',
          a: 'Yes, with valid registration and insurance. We provide temporary tags valid for 60 days while title processes.'
        },
        {
          q: 'Do you handle out-of-state registration?',
          a: 'We can facilitate, but buyer is responsible for their state DMV requirements and fees. We provide necessary documentation.'
        },
        {
          q: 'What happens if I don\'t pick up my vehicle within 60 days?',
          a: 'After 60 days from the date of sale, a storage fee of $25.00 per day will be assessed. We strongly recommend completing your title transfer and vehicle pickup as soon as possible to avoid these additional charges. Storage fees must be paid in full before vehicle release.'
        }
      ]
    },
    {
      category: 'INSPECTION & CONDITION',
      questions: [
        {
          q: 'Can I have a mechanic inspect the vehicle?',
          a: 'Absolutely. We encourage independent pre-purchase inspections. Buyer arranges and pays for inspection.'
        },
        {
          q: 'Do you provide vehicle history reports?',
          a: 'We decode VINs through NHTSA. Full Carfax/AutoCheck reports available upon request for specific vehicles.'
        },
        {
          q: 'What does "AS-IS" actually mean?',
          a: 'No post-sale repairs, modifications, or refunds. You accept the vehicle in its current disclosed condition. We document known issues—unknown issues are possible.'
        }
      ]
    },
    {
      category: 'LOGISTICS',
      questions: [
        {
          q: 'Do you ship vehicles?',
          a: 'We coordinate with licensed transport carriers. Buyer pays shipping costs. Quotes provided upon request.'
        },
        {
          q: 'Can I pick up the vehicle immediately?',
          a: 'Yes, once payment clears and paperwork is complete. Cash/wire = same-day pickup. Checks require 3-5 days clearance.'
        },
        {
          q: 'What are your business hours?',
          a: 'Monday-Saturday: 9:00 AM - 6:00 PM CST. Closed Sundays. Appointments recommended for test drives.'
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-6">
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
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.faq.searchPlaceholder}
              className="w-full bg-tj-dark border border-white/10 pl-12 pr-4 py-4 text-white focus:border-tj-gold outline-none transition-colors"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            {t.faq.noResults} "{searchQuery}"
          </div>
        ) : (
          filteredFaqs.map((category, catIdx) => (
            <div key={catIdx} className="mb-12">
              <h2 className="text-tj-gold text-xs uppercase tracking-[0.4em] mb-6 font-bold border-b border-tj-gold/20 pb-2">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, idx) => {
                  const globalIdx = catIdx * 100 + idx;
                  const isOpen = openIndex === globalIdx;

                  return (
                    <div key={idx} className="bg-tj-dark border border-white/10 overflow-hidden hover:border-tj-gold/30 transition-colors">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                        className="w-full text-left p-6 flex justify-between items-center gap-4 group"
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
            </div>
          ))
        )}

        <div className="bg-tj-gold/10 border border-tj-gold/30 p-12 text-center mt-16">
          <h3 className="text-white font-display text-2xl mb-4">{t.faq.stillHaveQuestions}</h3>
          <p className="text-gray-400 mb-6">
            {t.faq.contactPrompt}
          </p>
          <a
            href="/contact"
            className="inline-block bg-tj-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors"
          >
            {t.faq.contactCta}
          </a>
        </div>

      </div>
    </div>
  );
};

export default FAQ;
