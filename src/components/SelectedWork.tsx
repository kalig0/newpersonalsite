import { caseStudies, portfolio } from '../content/portfolio';

export default function SelectedWork() {
  const section = portfolio.sections.work;
  return <section className="section container" id="work" aria-labelledby="work-title">
    <div className="section-heading"><p className="eyebrow">{section.eyebrow}</p><h2 id="work-title">{section.title}</h2><p className="section-intro">{section.intro}</p></div>
    <div className="case-studies">{caseStudies.map(study => <article className={`case-study case-${study.id}`} id={study.id} key={study.id} aria-labelledby={`${study.id}-title`}>
      <div className="system-panel">
        <div className="system-topline"><span>System focus</span><span>{study.number}</span></div>
        <div className="system-path" aria-label="System overview">{study.system.map((step, index) => <div className="system-step" key={step}><span className="step-number">0{index + 1}</span><span>{step}</span>{index < study.system.length - 1 && <span className="step-connector" aria-hidden="true">↓</span>}</div>)}</div>
        <p className="system-caption">{study.focus}</p>
      </div>
      <div className="case-content"><p className="eyebrow">{study.category}</p><h3 id={`${study.id}-title`}>{study.title}</h3><p className="case-summary">{study.summary}</p>
        <div className="case-contribution"><span className="small-label">My contribution</span><p>{study.contribution}</p></div>
        <ul className="tags" aria-label="Technologies">{study.technologies.map(tech => <li key={tech}>{tech}</li>)}</ul>
        <details><summary>Inside the engineering <span className="details-plus" aria-hidden="true" /></summary><div className="case-details"><p><strong>The challenge.</strong> {study.challenge}</p><ul>{study.details.map(detail => <li key={detail}>{detail}</li>)}</ul>{study.date && <p className="study-date">Research period: {study.date}</p>}</div></details>
      </div>
    </article>)}</div>
  </section>;
}
