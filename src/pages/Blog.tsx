import './Blog.scss';

const Blog = () => {
  return (
    <section className="section blog" aria-labelledby="blog-title">
      <div className="section__head">
        <h2 id="blog-title">Blog</h2>
        <p>
          Long-form writing on language design, low-level engineering, and the
          crossover between music and code.
        </p>
      </div>

      <div className="blog__grid">
        <article className="blog-card">
          <p className="blog-card__meta">Draft · 8 min read</p>
          <h3>Building Demi: Creating a Customizable Programming Language</h3>
          <p>
            A look at the VM interpreter, assembly expansion, and the vision behind
            Demi.
          </p>
          <button className="blog-card__cta" type="button">Coming soon</button>
        </article>

        <article className="blog-card">
          <p className="blog-card__meta">Draft · 6 min read</p>
          <h3>OS Development: Lessons from TinyKernel</h3>
          <p>
            What I learned from building a hobby kernel, and how it shaped my systems
            thinking.
          </p>
          <button className="blog-card__cta" type="button">Coming soon</button>
        </article>

        <article className="blog-card">
          <p className="blog-card__meta">Draft · 5 min read</p>
          <h3>The Intersection of Music and Code</h3>
          <p>
            DJ sets, late-night builds, and how rhythm sneaks into engineering
            workflows.
          </p>
          <button className="blog-card__cta" type="button">Coming soon</button>
        </article>
      </div>
    </section>
  );
};

export default Blog;
