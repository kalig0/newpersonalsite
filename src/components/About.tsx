import { FC } from 'react';

const aboutItems = [
    {
        label: "Projects done",
        number: 10,
    },
    {
        label: "Years of experience",
        number: 1,
    }
];

const About: FC = () => {
    return (
        <section
            id="about"
            className="section"
        >
            <div className="container">
                <div className="bg-zinc-800/50 p-7 rounded-2xl md:p-12 reveal-up">
                    <p className="text-zinc-300 mb-4 md:mb-8 md:text-xl md:max-w-[60ch]">
                        Welcome! I'm Daniel, a results-driven Machine Learning Engineer and Software Developer with over a year of experience in developing machine learning models, fine-tuning large language models, and implementing full-stack applications. 
                        I will work with your vision to create effective and scalable real-world products.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 md:gap-7">
                        {
                            aboutItems.map(({ label, number }) =>(
                                <div key={label}>
                                    <div className="flex items-center md:mb-2">
                                        <span className="text-2xl font-semibold md:text-4xl">{number}</span>
                                        <span className="text-sky-400 font-semibold md:text-3xl">+</span>
                                    </div>

                                    <p className="text-sm text-zinc-400">{label}</p>
                                </div>
                            ))
                        }

                        <img
                            src="/images/icon.ico"
                            alt="Logo"
                            width={30}
                            height={30}
                            className="ml-auto md:w-[40px] md:h-[40px]"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About;