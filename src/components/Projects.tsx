import { FC } from 'react';

const projects = [
    {
        date: "May 2024 — Present",
        title: "ASSISTments",
        type: "Research Project",
        description: [
            "Fine-tuned large language models to enhance the accuracy of feedback to math questions.",
            "Trained models on millions of student response data to develop and implement effective improvement strategies for student feedback.",
            "Implemented vector database using FAISS to generate feedback and score for student responses with retrieval augmented generation, improving large language model generated content accuracy by 30%."
        ],
        technologies: ["Python", "TensorFlow", "LLMs", "Fine Tuning", "Prompt Engineering", "Vector Database"],
    }
];

const Projects: FC = () => {
    return (
        <section className="section" id="projects">
            <div className="container">
                <h2 className="headline-2 reveal-up">Projects</h2>

                <ol className="group/list mt-3 mb-8 reveal-up">
                    {projects.map((project, index) => (
                        <li key={index} className="mb-12 reveal-up">
                            <div className="group relative grid pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"></div>
                                <header className="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2" aria-label={project.date}>
                                    {project.date}
                                </header>
                                <div className="z-10 sm:col-span-6">
                                    <h3 className="font-medium leading-snug">
                                        <div>
                                            {project.companyUrl ? (
                                                <a
                                                    className="inline-flex items-baseline font-medium leading-tight hover:text-sky-400 focus-visible:text-sky-400 group/link text-base"
                                                    href={project.companyUrl}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    aria-label={`${project.title} at ${project.type} (opens in a new tab)`}
                                                >
                                                    <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                                                    <span>
                                                        {project.title} · &nbsp; {project.type}
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            className="inline-block h-4 w-4 shrink-0 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none ml-1 translate-y-px"
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                                                                clipRule="evenodd"
                                                            ></path>
                                                        </svg>
                                                    </span>
                                                </a>
                                            ) : (
                                                <span>
                                                    {project.title} · &nbsp; {project.type}
                                                </span>
                                            )}
                                        </div>
                                    </h3>
                                    <p className="mt-2 text-sm leading-normal text-zinc-400">
                                        {project.description.map((desc, i) => (
                                            <span key={i}>{desc}<br /></span>
                                        ))}
                                    </p>
                                    <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
                                        {project.technologies.map((tech, i) => (
                                            <li key={i} className="mr-1.5 mt-2">
                                                <div className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400">
                                                    {tech}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default Projects;
