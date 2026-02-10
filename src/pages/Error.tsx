import { Link, useLocation } from 'react-router-dom';
import './Error.scss';

type ErrorCode = 403 | 404 | 500;

type ErrorCopy = {
  title: string;
  message: string;
};

const errorCopy: Record<ErrorCode, ErrorCopy> = {
  403: {
    title: 'Access denied',
    message: 'This route is locked down. If you think this is a mistake, let me know.',
  },
  404: {
    title: 'Page not found',
    message: 'The page you are looking for does not exist or has moved.',
  },
  500: {
    title: 'Something went wrong',
    message: 'The site hit an unexpected error. Try again or return home.',
  },
};

type ErrorPageProps = {
  code: ErrorCode;
  guarded?: boolean;
};

const ErrorPage = ({ code, guarded = false }: ErrorPageProps) => {
  const location = useLocation();
  const allowedCode = location.state?.errorCode as ErrorCode | undefined;
  const resolvedCode = guarded && allowedCode !== code ? 404 : code;
  const copy = errorCopy[resolvedCode] ?? errorCopy[404];

  return (
    <section className="error-page" aria-labelledby="error-title">
      <div className="error-page__content">
        <p className="error-page__code">{resolvedCode}</p>
        <h1 id="error-title">{copy.title}</h1>
        <p className="error-page__message">{copy.message}</p>
        <div className="error-page__actions">
          <Link className="error-page__cta" to="/">Back to home</Link>
          <Link className="error-page__ghost" to="/blog">Read the blog</Link>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
