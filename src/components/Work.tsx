import { experience, portfolio } from '../content/portfolio';

export default function Work() {
  const section = portfolio.sections.experience;
  return <section className="section container" id="experience" aria-labelledby="experience-title">
    <div className="section-heading"><p className="eyebrow">{section.eyebrow}</p><h2 id="experience-title">{section.title}</h2><p className="section-intro">{section.intro}</p></div>
    <ol className="experience-list">{experience.map(job => <li className="experience-row" key={job.company}>
      <div className="experience-meta"><p>{job.date}</p><span>{job.location}</span></div>
      <div className="experience-content"><h3>{job.company}</h3><p className="job-role">{job.role}</p><ul>{job.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></div>
    </li>)}</ol>
  </section>;
}
