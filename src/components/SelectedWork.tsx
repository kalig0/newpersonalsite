import { caseStudies } from '../content/portfolio';
import Arrow from './Arrow';

function SystemSymbol({ index, project }: { index: number; project: string }) {
  if (project !== 'voice') {
    const paths = project === 'workflows' ? [
      'M5 5h26v26H5zM5 12h26M11 18h14M11 24h8',
      'M8 18l6 6L28 10M5 5h26v26H5z',
      'M14 5h8v8h-8zM4 24h8v8H4zM24 24h8v8h-8zM18 13v6M8 24v-5h20v5',
    ] : [
      'M8 3h14l7 7v23H8zM22 3v8h7M13 17h11M13 23h11',
      'M5 5h12v18H5zM22 10h9v21h-9zM9 11h4M9 16h4',
      'M4 5h28v21H17l-8 6v-6H4zM10 12h16M10 18h10',
    ];
    return <svg viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><path d={paths[index]} /></svg>;
  }
  return <svg viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">{index === 0 ? <path d="M11 5H7c-2 0-3 2-2 5 4 11 10 17 21 21 3 1 5 0 5-2v-5l-8-3-3 4c-5-3-8-6-10-10l4-3z" /> : index === 1 ? <path d="M5 17v3m5-10v17m5-22v26m6-21v17m5-20v23m5-16v8" /> : <><circle cx="13" cy="12" r="5" /><circle cx="25" cy="24" r="5" /><path d="m17 16 4 4M8 27h7M25 6v7" /></>}</svg>;
}

export default function SelectedWork() {
  return <section id="work" aria-label="Selected engineering work"><div id="home" />
    {caseStudies.map((study, i) => <article className={`case-study case-${study.id}`} id={study.id} key={study.id} aria-labelledby={`${study.id}-title`}>
      <div className="project-heading container">{i === 0 ? <h1 id={`${study.id}-title`}>{study.title}</h1> : <h2 id={`${study.id}-title`}>{study.title}</h2>}<p>{study.category}<br />{study.technologies.join(' · ')}</p></div>
      <div className="system-panel"><div className="container"><div className="system-topline"><span>{i === 0 ? 'From a phone call to a real conversation.' : study.summary}</span><span>System overview</span></div>
        <ol className="system-path" aria-label="System overview">{study.system.map((step, index) => <li className="system-step" key={step}><div className="system-symbol"><SystemSymbol index={index} project={study.id} /></div><div><strong>{step}</strong>{i === 0 && <span>{['Telephony integration', 'Streaming audio & call state', 'Knowledge into conversation'][index]}</span>}</div>{index < study.system.length - 1 && <span className="step-connector" aria-hidden="true" />}</li>)}</ol><p className="system-caption">{study.focus}</p>
      </div></div>
      <div className="container"><div className="contribution"><p>{study.contribution}</p><p>{study.challenge}</p></div><details><summary>Inside the engineering <span className="details-plus" aria-hidden="true" /></summary><div className="case-details"><p>{study.summary}</p><ul>{study.details.map(detail => <li key={detail}>{detail}</li>)}</ul>{study.date && <p className="study-date">Research period: {study.date}</p>}</div></details>
      {i === 0 && <nav className="project-index" aria-label="More selected work">{caseStudies.slice(1).map(item => <a href={`#${item.id}`} key={item.id}><span>{item.title}<small>{item.technologies.join(' / ')}</small></span><Arrow /></a>)}</nav>}</div>
    </article>)}
  </section>;
}
