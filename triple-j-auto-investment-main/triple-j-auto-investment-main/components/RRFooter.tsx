import React from 'react';
import { Link } from 'react-router-dom';

export const RRFooter = () => {
  return (
    <footer
      className="relative overflow-hidden text-center"
      style={{
        backgroundColor: '#0F2A1E',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* Crest */}
      <img
        src="/GoldTripleJLogo.png"
        alt="Triple J Auto Investment"
        className="w-14 h-14 mx-auto mb-8 opacity-50"
      />

      {/* Company name */}
      <h2 className="font-serif text-[20px] font-normal tracking-[0.06em] text-[#F5F0E8] mb-2">
        TRIPLE J AUTO INVESTMENT LLC
      </h2>
      <p className="font-sans text-[12px] font-light tracking-[0.06em] text-[rgba(245,240,232,0.4)] leading-[1.8]">
        8774 Almeda Genoa Rd<br />Houston, TX 77075
      </p>

      {/* Separator */}
      <div className="w-[60px] h-[1px] bg-[rgba(201,168,76,0.15)] mx-auto my-10" />

      {/* Nav links */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
        {[
          { to: '/inventory', label: 'Inventory' },
          { to: '/finance', label: 'Financing' },
          { to: '/services', label: 'Rentals' },
          { to: '/about', label: 'About' },
          { to: '/contact', label: 'Contact' },
          { to: '/legal/privacy', label: 'Privacy' },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="font-sans text-[11px] font-normal tracking-[0.15em] uppercase text-[rgba(245,240,232,0.4)] hover:text-[#C9A84C] transition-colors duration-[400ms]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Socials */}
      <div className="flex justify-center gap-8 mb-10">
        <a href="https://www.facebook.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-[400ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Facebook</a>
        <a href="https://www.instagram.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-[400ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Instagram</a>
      </div>

      {/* Copyright */}
      <p className="font-sans text-[10px] font-light tracking-[0.15em] uppercase text-[rgba(245,240,232,0.25)]">
        &copy; {new Date().getFullYear()} Triple J Auto Investment LLC
      </p>
    </footer>
  );
};

export default RRFooter;
