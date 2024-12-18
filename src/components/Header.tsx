import { FC, useState, useRef, useEffect } from 'react';
import Navbar from "./Navbar";

const Header: FC = () => {
    const [navOpen, setNavOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const contactButtonRef = useRef<HTMLAnchorElement | null>(null);


    // Close the navbar when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                navOpen &&
                headerRef.current &&
                !headerRef.current.contains(event.target as Node)
            ) {
                setNavOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [navOpen]);

    return (
        <header
            ref={headerRef}
            className="fixed top-0 left-0 w-full h-20 flex items-center z-40 bg-gradient-to-b from-zinc-900 to-zinc-900/0"
        >
            <div className="max-w-screen-2xl w-full mx-auto px-4 flex justify-between items-center md:px-6 md:grid md:grid-cols-[1fr,3fr,1fr]">
                <h1>
                    <a 
                        href="/" 
                        className="logo"
                    >
                        <img 
                            src="/images/icon.ico" 
                            width={40} 
                            height={40} 
                            alt="Daniel Yu"
                        />
                    </a>
                </h1>

                <div className="relative md:justify-self-center">
                    <button 
                        className="menu-btn md:hidden"
                        onClick={() => setNavOpen((prev) => !prev)}
                    >
                        <span className="material-symbols-rounded">
                            {navOpen ? 'close' : 'menu'}
                        </span>
                    </button>

                    {/* Pass setNavOpen to Navbar to allow closing on link click */}
                    <Navbar navOpen={navOpen} setNavOpen={setNavOpen} contactButtonRef={contactButtonRef} />
                </div>

                <a
                    href="#contact"
                    ref={contactButtonRef}
                    className="btn btn-secondary max-md:hidden md:justify-self-end"
                >
                    Contact Me
                </a>
            </div>
        </header>
    );
};

export default Header;
