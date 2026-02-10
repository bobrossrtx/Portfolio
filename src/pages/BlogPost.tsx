import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getBlogPosts } from '../utils/blog';
import ErrorPage from './Error';
import './Blog.scss';

const BlogPost = () => {
  const { slug } = useParams();
  const posts = getBlogPosts();
  const post = posts.find(item => item.slug === slug);

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
