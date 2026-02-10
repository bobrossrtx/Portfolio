import { experienceEntries } from '../../data/experience';
import './Experience.scss';

const Experience = () => {
  return (
    <section id="experience" className="section experience" aria-labelledby="experience-title">
      <div className="section__head">
        <h2 id="experience-title">Experience</h2>
        <p>
          Project-led experience across systems work, language tooling, and community-driven
          learning — plus DJing on the side.
        </p>
      </div>

      <div className="experience__grid">
        {experienceEntries.map(entry => (
          <article className="experience-card" key={entry.id}>
            <div className="experience-card__head">
              <div>
                <h3>{entry.title}</h3>
                <p className="experience-card__meta">
                  {entry.context} · {entry.timeframe}
                </p>
              </div>
            </div>

            <ul className="experience-card__highlights">
              {entry.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Experience;
