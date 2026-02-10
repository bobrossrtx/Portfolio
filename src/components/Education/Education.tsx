import { educationEntries } from '../../data/education';
import './Education.scss';

const Education = () => {
  return (
    <section id="education" className="section education" aria-labelledby="education-title">
      <div className="section__head">
        <h2 id="education-title">Education</h2>
        <p>
          A slightly unconventional route: engineering first, then IT, and now a focused
          push deeper into programming.
        </p>
      </div>

      <ol className="education__timeline">
        {educationEntries.map(entry => (
          <li className="education__item" key={entry.id}>
            <span className="education__dot" aria-hidden="true" />

            <article className="education-card">
              <header className="education-card__head">
                <div>
                  <p className="education-card__time">
                    <time>{entry.timeframe}</time>
                  </p>
                  <h3 className="education-card__title">{entry.title}</h3>
                  <p className="education-card__meta">{entry.institution}</p>
                </div>

                <span
                  className={`education-card__status ${
                    entry.status === 'In Progress'
                      ? 'education-card__status--progress'
                      : 'education-card__status--done'
                  }`}
                >
                  {entry.status}
                </span>
              </header>

              <ul className="education-card__highlights">
                {entry.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>

      <div className="education__subsection" aria-labelledby="self-education-title">
        <h3 id="self-education-title" className="education__subtitle">Self-Education</h3>

        <article className="education-card education-card--self">
          <p className="education-card__lead">
            A lot of my growth has happened outside the classroom — years of building,
            breaking, and iterating on projects until the concepts actually stuck.
          </p>

          <div className="education-card__body">
            <p>
              I started with the basics: HTML, then CSS, then JavaScript. My first “real”
              project was a very rough Disboard-style clone — it didn’t go far, but it taught
              me how front-end pieces connect, where things go wrong, and how to debug my way
              forward.
            </p>
            <p>
              After that I got into scripting and started experimenting with other languages
              (Ruby, C, C++, C#, and more). I skipped Java on purpose — even though Demi borrows
              some VM-style ideas from Java, I’ve never enjoyed it because it feels like a clunky C#,
              while also somehow feeling like the same language at the same time.
            </p>
            <p>
              A big turning point was interacting with Twitch developers. They introduced me
              to topics I wouldn’t have discovered on my own and pushed me to think wider than
              just “make it work”. That mindset shift is a big reason I ended up aiming at
              systems work and language design.
            </p>

            <h4 className="education-card__miniTitle">Key milestones</h4>
            <ul className="education-card__highlights education-card__highlights--tight">
              <li>
                Learned C/C++ fundamentals by building a simple password hasher and cracker.
              </li>
              <li>
                Went deep on OSDev and low-level work (drivers, kernel experiments). I spent
                about a year building my own kernel until I hit a few stubborn blockers and
                parked the project for later.
              </li>
              <li>
                Took a 6–8 month break, then came back focused on language work.
              </li>
              <li>
                Prototyped Demi in TypeScript for ~5 months to explore syntax and semantics,
                then restarted the project in C++ to take it seriously.
              </li>
              <li>
                Today Demi is approaching the next stage of its roadmap (native code generation),
                built on a custom VM + ISA/assembly layer called Dasm — inspired by x86/x64 but
                extended to support the language’s goals.
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Education;
