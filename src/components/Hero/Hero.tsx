import './Hero.scss';

const Hero = () => {
  return (
    <section id="hero" className="hero" aria-label="Hero">
      <div className="hero__content">
        <p className="hero__eyebrow">Systems, full-stack, and language design</p>
        <h1 className="hero__title">
          Building sharp tools and bold experiences across the stack.
        </h1>
        <p className="hero__tagline">
          <span className="hero__tagline-text">
            Systems Programmer | Full-Stack Developer | Language Designer
          </span>
        </p>

        <div className="hero__cta">
          <a className="btn btn--primary" href="#projects">View Projects</a>
          <a className="btn btn--ghost" href="#blog">Read Blog</a>
          <a className="btn btn--ghost" href="#contact">Get in Touch</a>
          <a className="btn btn--ghost" href="/resume.pdf" download>
            Download Resume
          </a>
        </div>

        <div className="hero__stats">
          <div className="stat">
            <span className="stat__value">7+</span>
            <span className="stat__label">Years Coding</span>
          </div>
          <div className="stat">
            <span className="stat__value">6+</span>
            <span className="stat__label">Notable Projects</span>
          </div>
          <div className="stat">
            <span className="stat__value">6</span>
            <span className="stat__label">Languages Used</span>
          </div>
          <div className="stat">
            <span className="stat__value">1.2k</span>
            <span className="stat__label">Contributions</span>
          </div>
        </div>
      </div>

      <div className="hero__media" aria-hidden="true">
        <div className="hero__avatar">
          <img src="/logo512x512.png" alt="Logo" className="site-logo__mark" style={{ verticalAlign: 'middle', objectFit: 'contain', width: "200px", height: "200px" }} />
        </div>
        <div className="hero__glow"></div>
      </div>
    </section>
  );
};

export default Hero;
