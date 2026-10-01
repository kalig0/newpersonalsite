import { portfolio } from '../content/portfolio';

export default function About() {
  return <section className="about-section" id="about" aria-labelledby="about-title"><div className="container section">
    <p className="eyebrow">{portfolio.sections.about.eyebrow}</p>
    <div className="about-grid"><div className="about-copy"><h2 id="about-title">{portfolio.sections.about.title}</h2><p>{portfolio.profile.about}</p><div className="portrait-signature"><img src="/images/avatar.jpg" width="72" height="72" loading="lazy" alt="Daniel Yu" /><div><span className="signature">Daniel Yu</span><span className="portrait-caption">Software engineer. Always learning.</span></div></div></div>
      <div className="about-background"><h3 className="small-label">Education</h3><div className="education-list">{portfolio.education.map(item => <div className="education-item" key={item.school}><h4>{item.degree}</h4><p>{item.school}</p><span>{item.date}</span></div>)}</div><h3 className="small-label skills-heading">Technical strengths</h3><dl className="skills-list">{portfolio.skills.map(group => <div key={group.label}><dt>{group.label}</dt><dd>{group.items.join(' · ')}</dd></div>)}</dl></div>
    </div>
  </div></section>;
}
