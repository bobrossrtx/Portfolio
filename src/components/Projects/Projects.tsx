import { projects } from '../../data/projects';
import './Projects.scss';

const Projects = () => {
  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="section__head">
        <h2 id="projects-title">Projects</h2>
        <p>
          Featured projects, deep dives, and experiments. The full case studies are
          landing here next.
        </p>
      </div>

      <div className="projects__grid">
        {projects.map(project => (
          <article className="project-card" key={project.id}>
            <div className="project-card__head">
              <div>
                <h3>{project.title}</h3>
                <p className="project-card__meta">
                  {project.status} · {project.timeframe}
                </p>
              </div>
              <a className="project-card__repo" href={project.repo} target="_blank" rel="noreferrer">
                Repo
              </a>
            </div>

            <p className="project-card__description">{project.description}</p>

            <ul className="project-card__highlights">
              {project.highlights.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <div className="project-card__tech">
              {project.tech.map((tech, index) => (
                <span key={index}>{tech}</span>
              ))}
            </div>

            {project.links && (
              <div className="project-card__links">
                {project.links.map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Projects;
