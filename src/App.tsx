import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { MusicProvider } from './components/Music/MusicProvider';
import MiniPlayer from './components/Music/MiniPlayer';
import SkipToBottom from './components/SkipToBottom';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Admin from './pages/Admin';
import ErrorPage from './pages/Error';
import { initEasterEggs } from './utils/easter-eggs';
import './styles/app.scss';

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/blog')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const id = location.hash.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const revealTargets = Array.from(document.querySelectorAll('.section, .hero')) as HTMLElement[];
    revealTargets.forEach(target => target.classList.add('reveal'));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    revealTargets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [location.pathname]);

  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/403" element={<ErrorPage code={403} guarded />} />
        <Route path="/404" element={<ErrorPage code={404} guarded />} />
        <Route path="/500" element={<ErrorPage code={500} guarded />} />
        <Route path="*" element={<ErrorPage code={404} />} />
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    initEasterEggs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MusicProvider>
        <div className="app-container">
          <a className="skip-link" href="#main">Skip to content</a>
          <Navigation theme={theme} onToggleTheme={toggleTheme} />
          <main id="main" className={isScrolled ? 'main main--lifted' : 'main'}>
            <AppRoutes />
          </main>
          <Footer />
          <MiniPlayer />
          <SkipToBottom />
        </div>
      </MusicProvider>
    </BrowserRouter>
  );
}

export default App;
