import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './Navigation.scss';

type NavigationProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

const Navigation = ({ theme, onToggleTheme }: NavigationProps) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');

  const navSections = useMemo(
    () => ['about', 'projects', 'github', 'music', 'education', 'experience', 'contact'],
    [],
  );

  const isBlogRoute = location.pathname.startsWith('/blog');

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sections = navSections
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const updateActive = () => {
      const offset = 160;
      let current = sections[0]?.id ?? '';

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom > offset) {
          current = section.id;
        }
      });

      setActiveSection(current);
    };

    updateActive();

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [location.pathname, navSections]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-logo" to={{ pathname: '/', hash: '#hero' }} aria-label="Go to top">
          <img src="/logo512x512.png" alt="Logo" className="site-logo__mark" width="40" height="32" style={{ verticalAlign: 'middle', objectFit: 'contain' }} />
          <span className="site-logo__text">Owen Boreham</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <Link
            className={`site-nav__link ${activeSection === 'about' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#about' }}
            aria-current={activeSection === 'about' ? 'page' : undefined}
          >
            About
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'projects' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#projects' }}
            aria-current={activeSection === 'projects' ? 'page' : undefined}
          >
            Projects
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'github' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#github' }}
            aria-current={activeSection === 'github' ? 'page' : undefined}
          >
            GitHub
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'music' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#music' }}
            aria-current={activeSection === 'music' ? 'page' : undefined}
          >
            Music
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'education' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#education' }}
            aria-current={activeSection === 'education' ? 'page' : undefined}
          >
            Education
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'experience' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#experience' }}
            aria-current={activeSection === 'experience' ? 'page' : undefined}
          >
            Experience
          </Link>
          <Link
            className={`site-nav__link ${activeSection === 'contact' ? 'is-active' : ''}`}
            to={{ pathname: '/', hash: '#contact' }}
            aria-current={activeSection === 'contact' ? 'page' : undefined}
          >
            Contact
          </Link>
        </nav>

        <div className="site-header__actions">
          <Link
            className={`site-blog-link ${isBlogRoute ? 'is-active' : ''}`}
            to="/blog"
            aria-current={isBlogRoute ? 'page' : undefined}
          >
            Blog
          </Link>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
