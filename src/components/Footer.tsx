import { portfolio } from '../content/portfolio';

export default function Footer() {
  return <footer className="container footer"><span>© {new Date().getFullYear()} {portfolio.profile.name}</span><span>Thoughtful systems. Useful products.</span><a href="#home">Back to top <span aria-hidden="true">↑</span></a></footer>;
}
