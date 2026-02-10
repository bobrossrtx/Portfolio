import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const year = new Date().getFullYear();

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
          <Link className="site-footer__button" to={{ pathname: '/', hash: '#contact' }}>
            Say hello
          </Link>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {year} Owen Boreham. Built with React + TypeScript.</p>
      </div>
    </footer>
  );
};

export default Footer;
