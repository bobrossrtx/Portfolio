import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchBlogPosts, type BlogPostRecord } from '../utils/blog-api';
import ErrorPage from './Error';
import './Blog.scss';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      try {
        const posts = await fetchBlogPosts();
        if (!isMounted) return;
        const match = posts.find(item => item.slug === slug) ?? null;
        setPost(match);
        setIsLoading(false);
        setError(null);
      } catch (error) {
        if (!isMounted) return;
        setPost(null);
        setIsLoading(false);
        setError(error instanceof Error ? error.message : 'Unable to load post.');
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <section className="section blog-post" aria-live="polite">
        <p>Loading post...</p>
      </section>
    );
  }

  if (error) {
    return <ErrorPage code={500} guarded />;
  }

  if (!post) {
    return <ErrorPage code={404} guarded />;
  }

  return (
    <article className="section blog-post" aria-labelledby="post-title">
      <div className="blog-post__header">
        <Link className="blog-post__back" to="/blog">Back to blog</Link>
        <p className="blog-post__meta">
          {post.date}
          {post.readTime ? ` · ${post.readTime}` : ''}
          {post.author ? ` · ${post.author}` : ''}
        </p>
        <h2 id="post-title">{post.title}</h2>
        {post.excerpt ? <p className="blog-post__excerpt">{post.excerpt}</p> : null}
        {post.tags.length ? (
          <div className="blog-post__tags">
            {post.tags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="blog-post__body">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
};

export default BlogPost;
