import Header from './components/Header';
import Hero from './components/Hero';
import SelectedWork from './components/SelectedWork';
import Work from './components/Work';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header /><main id="main-content"><Hero /><SelectedWork /><Work /><About /><Contact /></main><Footer /></>;
}
