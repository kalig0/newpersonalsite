import { FC, useEffect } from 'react';
import { ButtonPrimary } from "./Button";

interface NavItem {
    label: string;
    href: string;
}

interface SocialLink {
    label: string;
    href: string;
}

const navItems: NavItem[] = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Experience', href: '#experience' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact Me', href: '#contact' },
];

const socialLinks: SocialLink[] = [
    {
      label: 'GitHub',
      href: 'https://www.github.com/kalig0'
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/itsyangyu'
    },
    // {
    //   label: 'Twitter X',
    //   href: 'https://x.com/'
    // },
    // {
    //   label: 'Instagram',
    //   href: 'https://www.instagram.com/'
    // },
    // {
    //   label: 'CodePen',
    //   href: 'https://codepen.io/'
    // }
]

const Footer: FC = () => {
    useEffect(() => {
        const copyrightYearSpan = document.getElementById('copyright-year');
        if (copyrightYearSpan) {
            (copyrightYearSpan as HTMLSpanElement).textContent = new Date().getFullYear().toString();
        }
    }, []);

    return (
        <footer className="section" id="footer">
            <div className="container">

                <div className="lg:grid lg:grid-cols-2">
                    <div className="mb-10">
                        <h2 className="headline-1 mb-8 lg:max-w-[12ch] reveal-up">
                            Let's work together today!
                        </h2>

                        <ButtonPrimary 
                            href="mailto:talldanielyu@gmail.com"
                            label="Contact me"
                            icon="chevron_right"
                            classes="reveal-up"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:pl-20">
                        <div>
                            <p className="mb-2 reveal-up">Sitemap</p>

                            <ul>
                                {navItems.map(({ label, href }) => (
                                    <li key={label}>
                                        <a 
                                            href={href} 
                                            className="block text-sm text-zinc-400 py-1 transition-colors hover:text-zinc-200 reveal-up"
                                        >
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="mb-2 reveal-up">Socials</p>

                            <ul>
                                {socialLinks.map(({ label, href }) => (
                                    <li key={label}>
                                        <a 
                                            href={href} 
                                            target="_blank"
                                            className="block text-sm text-zinc-400 py-1 transition-colors hover:text-zinc-200 reveal-up"
                                        >
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-10 mb-8">
                    <a 
                        href="/" 
                        className="logo reveal-up"
                    >
                        <img 
                            src="/images/icon.ico" 
                            width={40}
                            height={40}
                            alt="Logo" 
                        />
                    </a>
                    <p className="text-zinc-500 text-sm reveal-up">
                        Copyright &copy; <span id="copyright-year"></span><span className='text-zinc-200'> Daniel Yu</span>
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;