import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const year = new Date().getFullYear();
  const isRelease = import.meta.env.VITE_RELEASE === 'true';

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark">OB</span>
          <div>
            <p className="site-footer__name">Owen Boreham</p>
            <p className="site-footer__meta">Systems + full-stack · Language design</p>
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <Link to={{ pathname: '/', hash: '#about' }}>About</Link>
          <Link to={{ pathname: '/', hash: '#projects' }}>Projects</Link>
          <Link to="/blog">Blog</Link>
          <Link to={{ pathname: '/', hash: '#music' }}>Music</Link>
          <Link to={{ pathname: '/', hash: '#contact' }}>Contact</Link>
        </nav>

        <div className="site-footer__cta">
          <p>Let’s build something sharp.</p>
          <div className="site-footer__cta-actions">
            <Link className="site-footer__button" to={{ pathname: '/', hash: '#contact' }}>
              Say hello
            </Link>
            <Link className="site-footer__button site-footer__button--ghost" to="/admin">
              Admin login
            </Link>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} Owen Boreham. Built with React + TypeScript.</p>
        {!isRelease && <span className="site-footer__dev">Dev mode</span>}
      </div>
    </footer>
  );
};

export default Footer;
