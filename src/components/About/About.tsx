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
          Systems-minded builder with a love for low-level tooling, clean interfaces,
          and practical automation. Focused on shipping reliable software while
          exploring language design, VM interpreters, and performance work.
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
