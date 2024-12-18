import { FC } from 'react';
import SkillCard from './SkillCard';

const skillItems = [
    {
        imgSrc: 'images/python.svg',
        label: 'Python',
        desc: 'Language'
    },
    {
        imgSrc: '/images/javascript.svg',
        label: 'JavaScript',
        desc: 'Language'
    },  
    {
        imgSrc: '/images/typescript.svg',
        label: 'TypeScript',
        desc: 'Language'
    },    
    {
        imgSrc: '/images/java.svg',
        label: 'Java',
        desc: 'Language'
    },     
    {
        imgSrc: '/images/html.svg',
        label: 'HTML',
        desc: 'Language'
    },     
    {
        imgSrc: '/images/css3.svg',
        label: 'CSS',
        desc: 'Language'
    },
    {
        imgSrc: '/images/cplus.svg',
        label: 'C++',
        desc: 'Language'
    },    
    {
        imgSrc: '/images/tailwindcss.svg',
        label: 'TailwindCSS',
        desc: 'CSS Framework'
    },
    {
        imgSrc: '/images/pytorch.svg',
        label: 'PyTorch',
        desc: 'Python Library'
    },
    {
        imgSrc: '/images/tensorflow.svg',
        label: 'TensorFlow',
        desc: 'Python Library'
    },
    {
        imgSrc: '/images/react.svg',
        label: 'React',
        desc: 'Library'
    },        
    {
        imgSrc: '/images/expressjs.svg',
        label: 'ExpressJS',
        desc: 'Node Framework'
    },
    {
        imgSrc: '/images/aws.svg',
        label: 'AWS',
        desc: 'Framework'
    },
    {
        imgSrc: '/images/mongodb.svg',
        label: 'MongoDB',
        desc: 'Database'
    },
    {
        imgSrc: '/images/mysql.svg',
        label: 'MySQL',
        desc: 'Database'
    },
    {
        imgSrc: '/images/docker.svg',
        label: 'Docker',
        desc: 'Tool'
    },
  ];

const Skills: FC = () => {
    return(
        <section className="section" id="skills">
            <div className="container">
                <h2 className="headline-2 reveal-up">
                    Skills
                </h2>

                <p className="text-zinc-400 mt-3 mb-8 max-w-[50ch] reveal-up">
                    Discover the powerful tools and technologies I use to develop machine learning models and software programs.
                </p>

                <div className="grid gap-3 grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))]">
                    {skillItems.map(({ imgSrc, label, desc }) => (
                        <SkillCard 
                            key={label}
                            imgSrc={imgSrc}
                            label={label}
                            desc={desc}
                            classes="reveal-up"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Skills;