import { portfolio } from '../content/portfolio';
import Arrow from './Arrow';

export default function Contact() {
  const { profile, sections } = portfolio;
  return <section className="contact-section container section" id="contact" aria-labelledby="contact-title">
    <p className="eyebrow">{sections.contact.eyebrow}</p><h2 id="contact-title">{sections.contact.title}<br /><em>{sections.contact.titleAccent}</em></h2>
    <div className="contact-bottom"><div><p>{sections.contact.intro}</p><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<Arrow diagonal /></a></div><div className="contact-links"><a className="text-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <Arrow diagonal /></a><a className="text-link" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub <Arrow diagonal /></a><a className="text-link" href={profile.resume}>Résumé <Arrow diagonal /></a></div></div>
  </section>;
}
