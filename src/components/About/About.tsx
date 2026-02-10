import { skillCategories } from '../../data/skills';
import './About.scss';

const About = () => {
  return (
    <section
      id="about"
      className="section section--flush-top about"
      aria-labelledby="about-title"
    >
      <div className="section__head">
        <h2 id="about-title">About</h2>
        <p>
          I’m a 19-year-old dev who’s into systems work, language design, and
          building products that feel sharp and intentional. I started in IT and
          learned by shipping projects the hard way. These days I write TypeScript
          and React for the web, but I’m just as happy in C/C++ working on VMs,
          kernels, and anything that teaches me how computers really tick.
        </p>
        <p>
          A big turning point was meeting Twitch devs who pushed me beyond “make it
          work” and into systems thinking. Right now I’m focused on Demi (my custom
          language), TinyKernel, and an AI strategy game called Census Conquest. I
          also DJ on the side, and music is how I reset my brain between builds.
        </p>
      </div>

      <div className="about__grid">
        {skillCategories.map(category => (
          <div className="skill-card" key={category.id}>
            <div className="skill-card__head">
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </div>

            <div className="skill-card__list">
              {category.skills.map(skill => {
                const tooltipId = `${category.id}-${skill.id}-tooltip`;

                return (
                  <div className="skill-chip" key={skill.id}>
                    <div className="skill-chip__title">
                      <span className="skill-chip__name">{skill.name}</span>
                      <div className="skill-chip__meta">
                        <span className="skill-chip__level">{skill.level}</span>
                        <button
                          type="button"
                          className="skill-chip__info"
                          aria-describedby={tooltipId}
                          aria-label={`More info about ${skill.name}`}
                        >
                          i
                        </button>
                        <div className="skill-tooltip" role="tooltip" id={tooltipId}>
                          <strong>{skill.years}</strong>
                          <p>{skill.description}</p>
                          <p>Projects: {skill.projects.join(', ')}</p>
                          <p>Proficiency: {skill.level}</p>
                        </div>
                      </div>
                    </div>
                    <div className="skill-chip__meter">
                      <span style={{ width: `${skill.proficiency}%` }}></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default About;
