import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaThumbtack } from 'react-icons/fa6';
import { getBlogPosts } from '../utils/blog';
import './Blog.scss';

const Blog = () => {
  const posts = getBlogPosts();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ pinnedOnly: false, includeTags: false });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map(term => term.trim())
      .filter(Boolean);

    return posts.filter(post => {
      if (filters.pinnedOnly && !post.pinned) return false;

      if (selectedTags.length > 0) {
        const matchesTag = post.tags.some(tag => selectedTags.includes(tag));
        if (!matchesTag) return false;
      }

      if (!terms.length) return true;

      const haystack = [
        post.title,
        post.excerpt,
        filters.includeTags ? post.tags.join(' ') : '',
      ]
        .join(' ')
        .toLowerCase();

      return terms.every(term => haystack.includes(term));
    });
  }, [posts, query, filters, selectedTags]);

  const visiblePosts = useMemo(() => {
    if (query.trim()) return filteredPosts;
    const pinned = filteredPosts.filter(post => post.pinned);
    const rest = filteredPosts.filter(post => !post.pinned);
    return [...pinned, ...rest];
  }, [filteredPosts, query]);

  return (
    <section className="section blog" aria-labelledby="blog-title">
      <div className="section__head blog__head">
        <div>
          <h2 id="blog-title">Blog</h2>
          <p>
            Long-form writing on language design, low-level engineering, and the
            crossover between music and code.
          </p>
        </div>
        <div className="blog__search">
          <label htmlFor="blog-search">Search posts</label>
          <input
            id="blog-search"
            type="search"
            placeholder="Search by title, tag, or topic"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <div className="blog__filters" aria-label="Advanced filters">
            <button
              type="button"
              className={`blog__filter ${filters.pinnedOnly ? 'is-active' : ''}`}
              onClick={() => setFilters(current => ({ ...current, pinnedOnly: !current.pinnedOnly }))}
            >
              Pinned only
            </button>
            <button
              type="button"
              className={`blog__filter ${filters.includeTags ? 'is-active' : ''}`}
              onClick={() => setFilters(current => ({ ...current, includeTags: !current.includeTags }))}
            >
              Include tags
            </button>
            <div className={`blog__filter-menu ${isTagMenuOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="blog__filter"
                onClick={() => setIsTagMenuOpen(open => !open)}
                aria-expanded={isTagMenuOpen}
                aria-haspopup="true"
              >
                Tags
                {selectedTags.length ? ` (${selectedTags.length})` : ''}
              </button>
              {isTagMenuOpen && (
                <div className="blog__filter-panel" role="menu">
                  {allTags.length === 0 && (
                    <p className="blog__filter-empty">No tags yet.</p>
                  )}
                  {allTags.map(tag => {
                    const checked = selectedTags.includes(tag);
                    return (
                      <label key={tag} className="blog__filter-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedTags(current =>
                              checked
                                ? current.filter(item => item !== tag)
                                : [...current, tag],
                            );
                          }}
                        />
                        <span>{tag}</span>
                      </label>
                    );
                  })}
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      className="blog__filter-clear"
                      onClick={() => setSelectedTags([])}
                    >
                      Clear tags
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {query && (
            <p className="blog__search-meta">
              {filteredPosts.length} result{filteredPosts.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      <div className="blog__list">
        {visiblePosts.map(post => {
          const terms = query
            .toLowerCase()
            .split(/\s+/)
            .map(term => term.trim())
            .filter(Boolean);

          return (
          <article className="blog-card" key={post.slug}>
            <p className="blog-card__meta">
              {post.date}
              {post.readTime ? ` · ${post.readTime}` : ''}
            </p>
            <h3>
              {post.title}
              {post.pinned && (
                <span className="blog-card__pin" aria-label="Pinned post">
                  <FaThumbtack aria-hidden="true" />
                </span>
              )}
            </h3>
            {post.excerpt ? <p>{post.excerpt}</p> : null}
            {post.tags.length > 0 && (
              <div className="blog-card__tags">
                {post.tags.map(tag => {
                  const tagLower = tag.toLowerCase();
                  const isMatch = selectedTags.includes(tag)
                    || terms.includes(tagLower)
                    || (filters.includeTags && terms.some(term => tagLower.includes(term)));

                  return (
                    <span
                      key={tag}
                      className={`blog-card__tag ${isMatch ? 'is-highlighted' : ''}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
            <Link className="blog-card__cta" to={`/blog/${post.slug}`}>
              Read post
            </Link>
          </article>
          );
        })}
        {!filteredPosts.length && (
          <div className="blog__empty">
            <p>No posts match that search yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
