import { FC } from 'react';

const experiences = [
    {
        date: "Jan 2025 — Present",
        role: "Software Development Engineer",
        company: "eGain",
        companyUrl: "https://www.egain.com/",
        description: [
            "Built end-to-end AI agent pipelines integrating embeddings, OpenSearch, rerankers, and LLM prompts with system/user instruction separation.",
            "Led development of reusable chat widget infrastructure, supporting authentication, portal selection, and multi-tenant embedding across customer environments.",
            "Migrated and standardized search APIs and OpenSearch schemas to support keyword and semantic search, multilingual responses, and consistent response contracts.",
            "Implemented batching, ingestion, and comparison APIs to ensure consistency between search indexes and source-of-truth data.",
            "Implemented caching, metadata pipelines, and analytics hooks to improve AI agent response quality, correctness, and performance.",
            "Owned Dockerized microservices and deployment workflows across environments, improving reliability and developer ergonomics.",
            "Integrated security and compliance tooling (Fortify, FOSSA, FedRAMP workflows) into CI/CD pipelines.",
            "Designed and maintained cloud-native AI services using Docker, AWS, OpenSearch, DynamoDB, SQS, and S3.",
            "Improved deployment workflows using Makefiles and environment-aware scripts, laying groundwork for Terraform-based infrastructure."
        ],
        technologies: ["Python", "TypeScript", , "Docker", "OpenSearch", "LLMs"]
    },
    {
        date: "May — Jul 2024",
        role: "Machine Learning Engineer Intern",
        company: "CVTE",
        companyUrl: "https://global.cvte.com/",
        description: [
            "Developed and implemented logic enhancements for a machine learning model utilized in over 5 million classrooms, improving the generated classroom analysis by 20%.",
            "Processed 1000s of classroom data to analyze and identify dips in classroom activity level.",
            "Collaborated with engineering team to deliver new large language model implementations every 2 weeks."
        ],
        technologies: ["Python", "Matplotlib", "Pyplot", "Agile"]
    },
    {
        date: "Aug 2022 — Aug 2023",
        role: "Software Engineer",
        company: "ReadMKT",
        description: [
            "Developed a rich text editor enabling users to edit content, images, links, and other components.",
            "Built an infinite scrolling feature on the main page, dynamically displaying up to 10 posts at a time and loading more groups of 10 as users scroll to the bottom.",
            "Implemented a rate limit management strategy to ensure complete API data fetching from financial data providers.",
            "Stored, updated, and retrieved user information, trade details, etc in NoSQL database.",
            "Deployed product to cloud supporting dual endpoints IPv4 and IPv6."
        ],
        technologies: ["TypeScript", "React", "Express", "MongoDB", "AWS Lambda", "CloudFront"]
    },
    {
        date: "May — Aug 2022",
        role: "Full Stack Developer Intern",
        company: "7G BioVentures",
        description: [
            "Implemented an internal system to manage investment project information, boosting employee productivity by 50%.",
            "Built a user-friendly, interactive, and component-based system.",
            "Managed data storage and retrieval in NoSQL Database."
        ],
        technologies: ["JavaScript", "React", "Express", "MongoDB"]
    }
];

const Work: FC = () => {
    return (
        <section className="section" id="experience">
            <div className="container">
                <h2 className="headline-2 reveal-up">Experience</h2>

                <ol className="group/list mt-3 mb-8 reveal-up">
                    {experiences.map((experience, index) => (
                        <li key={index} className="mb-12 reveal-up">
                            <div className="group relative grid pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50">
                                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"></div>
                                <header className="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2" aria-label={experience.date}>
                                    {experience.date}
                                </header>
                                <div className="z-10 sm:col-span-6">
                                    <h3 className="font-medium leading-snug">
                                        <div>
                                            {experience.companyUrl ? (
                                                <a
                                                    className="inline-flex items-baseline font-medium leading-tight hover:text-sky-400 focus-visible:text-sky-400 group/link text-base"
                                                    href={experience.companyUrl}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    aria-label={`${experience.role} at ${experience.company} (opens in a new tab)`}
                                                >
                                                    <span className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"></span>
                                                    <span>
                                                        {experience.role} · &nbsp; {experience.company}
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
                                                    {experience.role} · &nbsp; {experience.company}
                                                </span>
                                            )}
                                        </div>
                                    </h3>
                                    <p className="mt-2 text-sm leading-normal text-zinc-400">
                                        {experience.description.map((desc, i) => (
                                            <span key={i}>{desc}<br /></span>
                                        ))}
                                    </p>
                                    <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
                                        {experience.technologies.map((tech, i) => (
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

export default Work;
