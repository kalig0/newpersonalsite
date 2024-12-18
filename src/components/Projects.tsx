import { FC } from 'react';

const Projects: FC = () => {
    return (
        <section className="section" id="projects">
            <div className="container">
                <h2 className="headline-2 reveal-up">
                    Projects
                </h2>

                <ol className="group/list mt-3 mb-8 reveal-up">
                    <li className="mb-12 reveal-up">
                        <div
                            className="group relative grid pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50"
                        >
                            <div
                            className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"
                            ></div>
                            <header
                            className="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2"
                            aria-label="May 2024 to Present"
                            >
                            May 2024 — Present
                            </header>
                            <div className="z-10 sm:col-span-6">
                                <h3 className="font-medium leading-snug">
                                    <div>
                                    <div
                                        className="inline-flex items-baseline font-medium leading-tight  hover:text-sky-400 focus-visible:text-sky-400 group/link text-base "
                                        ><span
                                        className="absolute -inset-x-4 -inset-y-2.5 hidden rounded md:-inset-x-6 md:-inset-y-4 lg:block"
                                        ></span
                                        ><span
                                        >ASSISTments · &nbsp;
                                        <span className="inline-block"
                                            >Research Project
                                        </span></span
                                    ></div>
                                    </div>
                                </h3>
                                <p className="mt-2 text-sm leading-normal text-zinc-400">
                                Fine-tuned large language models to enhance the accuracy of feedback to math questions.
                                Trained models on millions of student response data to develop and implement effective improvement strategies
                                for student feedback.
                                Implemented vector database using FAISS to generate feedback and score for student responses with retrieval augmented generation,
                                improving large language model generated content accuracy by 30%.
                                </p>
                                <ul className="mt-2 flex flex-wrap" aria-label="Technologies used">
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        Python
                                    </div>
                                    </li>
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        TensorFlow
                                    </div>
                                    </li>
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        LLMs
                                    </div>
                                    </li>
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        Fine Tuning
                                    </div>
                                    </li> 
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        Prompt Engineering
                                    </div>
                                    </li>
                                    <li className="mr-1.5 mt-2">
                                    <div
                                        className="flex items-center rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-sky-400"
                                    >
                                        Vector Database
                                    </div>
                                    </li>                                    
                                </ul>
                            </div>
                        </div>
                    </li>               
                </ol>
            </div>             
        </section>
    )
}

export default Projects;