import { Link } from 'react-router-dom';
import './Navigation.scss';

type NavigationProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

const Navigation = ({ theme, onToggleTheme }: NavigationProps) => {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-logo" to="/" aria-label="Go to homepage">
          <span className="site-logo__mark">OB</span>
          <span className="site-logo__text">Owen Boreham</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <a href="/#about">About</a>
          <a href="/#projects">Projects</a>
          <Link to="/blog">Blog</Link>
          <a href="/#music">Music</a>
          <a href="/#education">Education</a>
          <a href="/#experience">Experience</a>
          <a href="/#contact">Contact</a>
        </nav>

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={theme === 'light'}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </header>
  );
};

export default Navigation;
