import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Inventory", href: "/inventory" },
  { label: "Financing", href: "/financing" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-black border-t border-tj-gold/10">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Image
              src="/GoldTripleJLogo.png"
              alt="Triple J Auto Investment"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <p className="mt-3 font-serif text-sm text-tj-cream/80">
              Triple J Auto Investment
            </p>
            <p className="mt-1 text-[11px] text-white/30 tracking-wide">
              Houston&rsquo;s Premier Dealership
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-accent text-[10px] uppercase tracking-[0.3em] text-tj-gold/60 mb-1">
              Navigate
            </h4>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-accent text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-tj-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h4 className="font-accent text-[10px] uppercase tracking-[0.3em] text-tj-gold/60 mb-1">
              Contact
            </h4>
            <a
              href="tel:+18324009760"
              className="font-serif text-sm text-tj-gold hover:text-tj-gold-light transition-colors"
            >
              (832) 400-9760
            </a>
            <address className="not-italic text-[11px] text-white/30 leading-relaxed">
              8774 Almeda Genoa Rd
              <br />
              Houston, TX 77075
            </address>
            <p className="text-[11px] text-white/20">Mon–Sat 9AM–7PM</p>
          </div>
        </div>
      </div>

      {/* Bottom compliance bar */}
      <div className="border-t border-white/5 py-6">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-[10px] tracking-wide">
            &copy; 2025 Triple J Auto Investment LLC. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="text-white/20 text-[10px] tracking-wide hover:text-tj-gold/40 transition-colors"
          >
            Dealer Login
          </Link>
          <p className="text-white/20 text-[10px] tracking-wide">
            Dealer License P171632
          </p>
        </div>
      </div>
    </footer>
  );
}
