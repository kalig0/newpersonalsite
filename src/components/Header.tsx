import { useEffect, useRef, useState } from 'react';
import { portfolio } from '../content/portfolio';
import Arrow from './Arrow';

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
    };
    const onOutside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const breakpoint = window.matchMedia('(min-width: 768px)');
    const onResize = () => { if (breakpoint.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    breakpoint.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      breakpoint.removeEventListener('change', onResize);
    };
  }, [open]);

  return <header className="site-header" ref={header}>
    <div className="container header-inner">
      <a className="wordmark" href="#home" onClick={() => setOpen(false)} aria-label="Daniel Yu, home">Daniel Yu<span className="wordmark-dot">.</span></a>
      <button className="menu-toggle" ref={menuButton} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'}<span className={open ? 'menu-icon is-open' : 'menu-icon'} aria-hidden="true"><i /><i /></span>
      </button>
      <nav id="primary-navigation" className={`primary-nav${open ? ' is-open' : ''}`} aria-label="Primary navigation">
        {portfolio.navigation.map(item => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
        <a className="nav-resume" href={portfolio.profile.resume}>Résumé <Arrow diagonal /></a>
      </nav>
    </div>
  </header>;
}
