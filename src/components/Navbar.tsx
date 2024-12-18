import { FC, useRef, RefObject, useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';
import PropTypes from 'prop-types';

interface NavItem {
    label: string;
    link: string;
    className: string;
}

interface NavProps {
    navOpen: boolean;
    setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
    contactButtonRef: React.RefObject<HTMLAnchorElement>;
}

const Navbar: FC<NavProps> = ({ navOpen, contactButtonRef }) => {
    const lastActiveLink: RefObject<HTMLAnchorElement> = useRef<HTMLAnchorElement>(null);
    const activeBox: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const lenis = useLenis();

    const sections = useRef<HTMLElement[]>([]);

    // Initialize sections by querying DOM
    useEffect(() => {
        sections.current = Array.from(document.querySelectorAll('section'));
    }, []);

    const initActiveBox = () => {
        if (activeBox.current && lastActiveLink.current) {
          requestAnimationFrame(() => {
            activeBox.current.style.top = `${lastActiveLink.current.offsetTop}px`;
            activeBox.current.style.left = `${lastActiveLink.current.offsetLeft}px`;
            activeBox.current.style.width = `${lastActiveLink.current.offsetWidth}px`;
            activeBox.current.style.height = `${lastActiveLink.current.offsetHeight}px`;            
          });
        }
    };

    useEffect(() => {
      if (!lastActiveLink.current && sections.current.length > 0) {
          const defaultActiveLink = document.querySelectorAll('.nav-link')[activeIndex] as HTMLAnchorElement;
          if (defaultActiveLink) {
              lastActiveLink.current = defaultActiveLink;
              defaultActiveLink.classList.add('active');
              initActiveBox();
          }
      }
    }, [activeIndex]); // Ensure this runs after sections and activeIndex are initialized
  

    useEffect(() => {
        window.addEventListener('resize', initActiveBox);
        return () => window.removeEventListener('resize', initActiveBox);
    }, []);

    const updateActiveLink = (index: number) => {
        setActiveIndex(index);

        if (activeBox.current && sections.current[index]) {
            const activeLink = document.querySelectorAll('.nav-link')[index] as HTMLAnchorElement;

            if (lastActiveLink.current) {
                lastActiveLink.current?.classList.remove('active');
            }
            activeLink.classList.add('active');
            lastActiveLink.current = activeLink;

            activeBox.current.style.top = `${activeLink.offsetTop}px`;
            activeBox.current.style.left = `${activeLink.offsetLeft}px`;
            activeBox.current.style.width = `${activeLink.offsetWidth}px`;
            activeBox.current.style.height = `${activeLink.offsetHeight}px`;
        }
    };

    // Listen for scroll and update active link
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 1; // Adjust for precision
            const footer = document.querySelector('#footer'); // Replace with your footer's ID or class
            const footerTop = footer?.offsetTop || 0;
        
            const currentIndex = sections.current.findIndex(
                (section) =>
                    Math.floor(section.offsetTop) <= scrollPosition &&
                    Math.floor(section.offsetTop) + section.offsetHeight > scrollPosition
            );
        
            if (footer && scrollPosition >= footerTop - window.innerHeight / 2) {
                // Footer is active
                updateActiveLink(navItems.length - 1); // Assume last item corresponds to "Contact Me"
        
                if (contactButtonRef.current && activeBox.current) {
                    const buttonRect = contactButtonRef.current.getBoundingClientRect();
                    const navbarRect = activeBox.current.parentElement?.getBoundingClientRect();
        
                    if (navbarRect) {
                        // Calculate position relative to the navbar
                        const top = buttonRect.top - navbarRect.top;
                        const left = buttonRect.left - navbarRect.left;
        
                        activeBox.current.style.top = `${top}px`;
                        activeBox.current.style.left = `${left}px`;
                        activeBox.current.style.width = `${buttonRect.width}px`;
                        activeBox.current.style.height = `${buttonRect.height}px`;
                        activeBox.current.classList.add('transparent');
                    }
                }
            } else if (currentIndex !== -1 && currentIndex !== activeIndex) {
                // Regular section handling
                updateActiveLink(currentIndex);
                activeBox.current.classList.remove('transparent');
            }
        };
        
        
  
      // Initialize active link on load
      handleScroll();
  
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, [activeIndex]);
  

    const navItems: NavItem[] = [
        { label: 'Home', link: '#home', className: 'nav-link' },
        { label: 'About', link: '#about', className: 'nav-link' },
        { label: 'Skills', link: '#skills', className: 'nav-link' },
        { label: 'Experience', link: '#experience', className: 'nav-link' },
        { label: 'Projects', link: '#projects', className: 'nav-link' },
        { label: 'Contact Me', link: '#contact', className: 'nav-link md:hidden' },
    ];

    return (
        <nav className={'navbar ' + (navOpen ? 'active' : '')}>
            {navItems.map(({ label, link, className }, key) => (
                <a
                    href={link}
                    key={key}
                    className={`${className} ${key === activeIndex ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        const targetSection = document.querySelector(link);
                        if (targetSection && lenis) {
                            lenis.scrollTo(targetSection, {
                                duration: 0.5, // Smooth scroll duration in seconds
                                easing: (t) => t, // Linear easing; customize as needed
                            });
                        }
                        updateActiveLink(key);
                    }}
                >
                    {label}
                </a>
            ))}
            <div className="active-box" ref={activeBox}></div>
        </nav>
    );
};

Navbar.propTypes = {
    navOpen: PropTypes.bool.isRequired,
};

export default Navbar;
