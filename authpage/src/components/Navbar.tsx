import React, { useState } from 'react';
import { Phone, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  activeView: string;
}

const CursorInteractiveNavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}> = ({ onClick, isActive, icon, label }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    // Subtle magnetic attraction towards cursor
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = ((x - centerX) / centerX) * 4;
    const deltaY = ((y - centerY) / centerY) * 4;
    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        transform: isHovered
          ? `translate3d(${offset.x}px, ${offset.y - 3}px, 0) scale(1.05)`
          : 'translate3d(0, 0, 0) scale(1)',
      }}
      className={`group relative overflow-hidden flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-white/85 hover:bg-white/95 backdrop-blur-md border border-muga-200/90 hover:border-forest-600/50 shadow-sm hover:shadow-xl hover:shadow-forest-900/10 text-xs sm:text-sm font-semibold font-brand-body text-[#1A202C]/90 hover:text-forest-800 transition-all duration-200 ease-out cursor-pointer select-none active:scale-95 ${
        isActive ? 'ring-2 ring-forest-600 border-forest-600 text-forest-700 font-bold bg-white shadow-md' : ''
      }`}
    >
      {/* Dynamic Cursor Spotlight Follow */}
      <span
        className="pointer-events-none absolute -inset-px rounded-full transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(85px circle at ${coords.x}px ${coords.y}px, rgba(30, 77, 43, 0.15), transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Glossy Sheen Sweep on Hover */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
        aria-hidden="true"
      />

      {/* Icon with interactive micro-bounce */}
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-115 group-hover:-rotate-6">
        {icon}
      </span>

      {/* Text Label */}
      <span className="relative z-10 tracking-tight">
        {label}
      </span>
    </button>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHelp,
  onOpenAbout,
  activeView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-20 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-transparent">
        {/* Logo / Brand Mark (Left) */}
        <div className="flex items-center space-x-3 cursor-pointer select-none group" onClick={() => handleNavClick(() => {})}>
          <div className="w-10 h-10 rounded-full bg-forest-600/10 border border-forest-600/30 flex items-center justify-center shadow-sm text-forest-600 transition-transform group-hover:scale-105 duration-300">
            {/* Elegant warm emblem: Leaf + Lotus petal motif */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" stroke="#D4A373" strokeWidth="1.5" />
              <path d="M12 6c-2 3-3 5-3 7 0 2 1.5 3 3 3s3-1 3-3c0-2-1-4-3-7z" fill="#1E4D2B" stroke="#1E4D2B" />
              <circle cx="12" cy="14" r="1.5" fill="#FAF7F2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-[#1A202C] font-brand-heading">
              Neuro<span className="text-forest-600">Nova</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase font-medium text-[#D4A373] -mt-1 font-brand-body">
              Care Companion
            </span>
          </div>
        </div>


        {/* Desktop CTA (Right) */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={onOpenHelp}
            className="text-sm font-semibold text-[#1E4D2B] underline decoration-forest-600/50 underline-offset-4 hover:opacity-60 transition-opacity font-brand-body"
          >
            Need help? Contact support
          </button>
        </div>

        {/* Mobile Hamburger (Visible below md) */}
        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
          className="md:hidden w-11 h-11 flex flex-col justify-center items-center space-y-1.5 focus:outline-none p-2 rounded-lg hover:bg-forest-600/5"
        >
          <span
            className={`block w-6 h-0.5 bg-[#1A202C] transition-all duration-300 transform ${
              mobileMenuOpen ? 'rotate-45 translate-y-2 bg-[#FAF7F2]' : ''
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#1A202C] transition-all duration-300 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#1A202C] transition-all duration-300 transform ${
              mobileMenuOpen ? '-rotate-45 -translate-y-2 bg-[#FAF7F2]' : ''
            }`}
          />
        </button>
      </header>

      {/* Mobile Overlay (Warm-toned, z-index: 15) */}
      <div
        className={`fixed inset-0 z-15 bg-[#18261C]/96 backdrop-blur-xl md:hidden flex flex-col items-center justify-center transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center space-y-7 text-center">
          <div className="mb-4">
            <span className="text-3xl font-bold tracking-tight text-[#FAF7F2] font-brand-heading">
              Neuro<span className="text-[#D4A373]">Nova</span>
            </span>
            <p className="text-xs text-[#FAF7F2]/60 mt-1 font-brand-body">Compassionate care for our elders</p>
          </div>

          <button
            onClick={() => handleNavClick(onOpenAbout)}
            className="text-2xl font-bold text-[#FAF7F2] hover:text-[#D4A373] transition-colors py-2"
          >
            About NeuroNova
          </button>
          <button
            onClick={() => handleNavClick(onOpenHelp)}
            className="text-2xl font-bold text-[#FAF7F2] hover:text-[#D4A373] transition-colors py-2"
          >
            Help & Safety
          </button>

          <div className="pt-6 border-t border-[#FAF7F2]/15 w-48 text-center">
            <p className="text-xs text-[#D4A373] mb-2 font-medium">Emergency Elder Helpline</p>
            <a
              href="tel:1800123456"
              className="text-base font-bold text-[#FAF7F2] bg-forest-700/60 px-4 py-2 rounded-full inline-flex items-center justify-center space-x-1.5 border border-muga-400/40"
            >
              <Phone className="w-4 h-4 text-[#D4A373]" aria-hidden="true" />
              <span>1800-NEURONOVA</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom-Right Corner Quick Links: Two separate interactive boxes */}
      <nav
        aria-label="Secondary navigation"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2.5 sm:gap-3"
      >
        <CursorInteractiveNavButton
          onClick={onOpenHelp}
          isActive={activeView === 'help'}
          icon={<ShieldCheck className="w-4 h-4 text-forest-600" aria-hidden="true" />}
          label="Help & Safety"
        />

        <CursorInteractiveNavButton
          onClick={onOpenAbout}
          isActive={activeView === 'about'}
          icon={<Sparkles className="w-4 h-4 text-[#D4A373]" aria-hidden="true" />}
          label="About NeuroNova"
        />
      </nav>
    </>
  );
};
