import { caseStudies, portfolio } from '../content/portfolio';
import Arrow from './Arrow';

export default function Hero() {
  const profile = portfolio.profile;
  return <section id="home" className="hero container" aria-labelledby="hero-title">
    <div className="hero-eyebrow"><span className="status-dot" /> {profile.role} <span className="eyebrow-separator">/</span> {profile.current}</div>
    <h1 id="hero-title">{profile.headline}<br /><em>{profile.headlineAccent}</em></h1>
    <div className="hero-bottom">
      <div className="hero-intro"><p>{profile.intro}</p><div className="hero-actions"><a className="button button-primary" href="#work">View selected work <Arrow /></a><a className="text-link" href={profile.resume}>View résumé <Arrow diagonal /></a></div></div>
      <div className="hero-index" aria-label="Engineering focus">
        {caseStudies.map((study, index) => <a key={study.id} href={`#${study.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{study.shortLabel || study.title}<Arrow diagonal /></a>)}
      </div>
    </div>
    <div className="hero-footnote"><span>{profile.focus}</span><a href="#work">Explore the work <span aria-hidden="true">↓</span></a></div>
  </section>;
}
