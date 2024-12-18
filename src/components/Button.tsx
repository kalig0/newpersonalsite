import { FC, ReactNode } from 'react';
import { useLenis } from 'lenis/react';

interface ButtonProps {
    href?: string;
    target?: '_self';
    label: string;
    icon?: ReactNode;
    classes?: string;
}

const ButtonPrimary: FC<ButtonProps> = ({
    href = "static/resume.pdf",
    target = '_self',
    label,
    icon,
    classes
}) => {
    if (href) {
        return (
            <a
                href={href}
                target={target}
                className={"btn btn-primary " + classes}
            >
                {label}

                {icon ? 
                    <span 
                        className="material-symbols-rounded"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                    : undefined
                }
            </a>
        )
    } else {
        return(
            <button
                className={"btn btn-primary " + classes}
            >
                {label}

                {icon ? 
                    <span 
                        className="material-symbols-rounded"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                    : undefined
                }
            </button>
        )
    }
}

const ButtonOutline: FC<ButtonProps> = ({
    href,
    target = '_self',
    label,
    icon,
    classes
}) => {
    const lenis = useLenis(); // Use Lenis hook for smooth scrolling

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (href && href.startsWith("#")) {
            e.preventDefault(); // Prevent default anchor behavior

            const targetSection = document.querySelector(href); // Find the target section
            if (targetSection && lenis) {
                lenis.scrollTo(targetSection, {
                    duration: 1, // Smooth scroll duration in seconds
                    easing: (t) => 1 - Math.pow(1 - t, 3), // Custom easing function
                });
            }
        }
    };

    if (href) {
        return (
            <a
                href={href}
                target={target}
                className={"btn btn-outline " + classes}
                onClick={handleClick}
            >
                {label}

                {icon ? 
                    <span 
                        className="material-symbols-rounded"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                    : undefined
                }
            </a>
        )
    } else {
        return(
            <button
                className={"btn btn-outline " + classes}
            >
                {label}

                {icon ? 
                    <span 
                        className="material-symbols-rounded"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                    : undefined
                }
            </button>
        )
    }
}

export {
    ButtonPrimary,
    ButtonOutline
};