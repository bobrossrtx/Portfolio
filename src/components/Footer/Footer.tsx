import { Link } from 'react-router-dom';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
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
          <div className="site-footer__cta-socials">
            <a
              className="site-footer__button site-footer__button--discord"
              href="https://discord.gg/KDm5dtyDxs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Discord community"
            >
              <FaDiscord style={{ marginRight: '0.5em', verticalAlign: 'middle' }} aria-hidden="true" />
              Join Discord
            </a>
            <a
              className="site-footer__button site-footer__button--github"
              href="https://github.com/bobrossrtx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              style={{ padding: '0.5em', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaGithub size={22} aria-hidden="true" />
            </a>
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
