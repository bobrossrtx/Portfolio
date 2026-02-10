import { useEffect, useMemo, useState } from 'react';
import { fetchGitHubStats } from '../../utils/github-api';
import type { GitHubStats } from '../../utils/github-api';
import './GitStats.scss';

type GitState = {
  loading: boolean;
  error: string | null;
  stats: GitHubStats | null;
};

const username = 'bobrossrtx';
const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

const GitStats = () => {
  const [state, setState] = useState<GitState>({
    loading: true,
    error: null,
    stats: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const stats = await fetchGitHubStats(username, token);

        if (!isMounted) return;

        setState({
          loading: false,
          error: null,
          stats,
        });
      } catch (error) {
        if (!isMounted) return;
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load GitHub stats right now.',
          stats: null,
        });
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalStars = useMemo(() => {
    return state.stats?.repos.reduce((sum, repo) => sum + repo.stargazerCount, 0) ?? 0;
  }, [state.stats]);

  const totalForks = useMemo(() => {
    return state.stats?.repos.reduce((sum, repo) => sum + repo.forkCount, 0) ?? 0;
  }, [state.stats]);

  const calendarDays = useMemo(() => {
    if (!state.stats) return [];
    return state.stats.calendar.weeks.flatMap(week => week.contributionDays);
  }, [state.stats]);

  const maxContributions = useMemo(() => {
    return calendarDays.reduce((max, day) => Math.max(max, day.contributionCount), 0);
  }, [calendarDays]);

  const activeDays = useMemo(() => {
    return calendarDays.filter(day => day.contributionCount > 0).length;
  }, [calendarDays]);

  const busiestDay = useMemo(() => {
    return calendarDays.reduce(
      (best, day) => (day.contributionCount > best.contributionCount ? day : best),
      { date: '', contributionCount: 0 },
    );
  }, [calendarDays]);

  const averagePerDay = useMemo(() => {
    if (!state.stats || calendarDays.length === 0) return 0;
    return state.stats.calendar.totalContributions / calendarDays.length;
  }, [calendarDays, state.stats]);

  const weeklyTotals = useMemo(() => {
    if (!state.stats) return [];
    return state.stats.calendar.weeks.map(week =>
      week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
    );
  }, [state.stats]);

  const maxWeekly = useMemo(() => {
    return weeklyTotals.reduce((max, total) => Math.max(max, total), 0);
  }, [weeklyTotals]);

  const weekdayTotals = useMemo(() => {
    if (!calendarDays.length) return [] as Array<{ label: string; total: number }>;
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = new Array(7).fill(0);

    calendarDays.forEach(day => {
      const index = new Date(day.date).getDay();
      totals[index] += day.contributionCount;
    });

    return labels.map((label, index) => ({ label, total: totals[index] }));
  }, [calendarDays]);

  const maxWeekday = useMemo(() => {
    return weekdayTotals.reduce((max, item) => Math.max(max, item.total), 0);
  }, [weekdayTotals]);

  const weekdayDistribution = useMemo(() => {
    const total = weekdayTotals.reduce((sum, item) => sum + item.total, 0);
    return weekdayTotals.map(item => ({
      ...item,
      percent: total ? (item.total / total) * 100 : 0,
    }));
  }, [weekdayTotals]);

  const longestStreak = useMemo(() => {
    if (!calendarDays.length) return 0;
    const sorted = [...calendarDays].sort((a, b) => a.date.localeCompare(b.date));
    let current = 0;
    let longest = 0;

    sorted.forEach(day => {
      if (day.contributionCount > 0) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });

    return longest;
  }, [calendarDays]);

  const bestWeek = useMemo(() => {
    return weeklyTotals.reduce((max, total) => Math.max(max, total), 0);
  }, [weeklyTotals]);

  const topWeekday = useMemo(() => {
    return weekdayDistribution.reduce(
      (best, item) => (item.percent > best.percent ? item : best),
      { label: '---', percent: 0, total: 0 },
    );
  }, [weekdayDistribution]);

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString();
  };

  const contributionSpectrum = useMemo(() => {
    if (!state.stats) return [] as Array<{ id: string; label: string; value: number; percent: number }>;
    const items = [
      { id: 'commits', label: 'Commits', value: state.stats.contributionTotals.commits },
      { id: 'prs', label: 'PRs', value: state.stats.contributionTotals.pullRequests },
      { id: 'issues', label: 'Issues', value: state.stats.contributionTotals.issues },
      { id: 'reviews', label: 'Reviews', value: state.stats.contributionTotals.reviews },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return items.map(item => ({
      ...item,
      percent: total ? (item.value / total) * 100 : 0,
    }));
  }, [state.stats]);

  const maxSpectrum = useMemo(() => {
    return contributionSpectrum.reduce((max, item) => Math.max(max, item.value), 0);
  }, [contributionSpectrum]);

  return (
    <section id="github" className="section git-stats" aria-labelledby="git-stats-title">
      <div className="section__head">
        <h2 id="git-stats-title">GitHub</h2>
        <p>
          A quick snapshot of what I've been shipping and experimenting with lately.
        </p>
      </div>

      {state.loading && (
        <div className="git-stats__status">Loading stats...</div>
      )}

      {state.error && (
        <div className="git-stats__status git-stats__status--error">
          {state.error}
        </div>
      )}

      {!state.loading && !state.error && state.stats && (
        <div className="git-stats__grid">
          <article className="git-stats__card git-stats__card--stat">
            <p className="git-stats__label">Public repos</p>
            <p className="git-stats__value">{state.stats.profile.publicRepos}</p>
          </article>
          <article className="git-stats__card git-stats__card--stat">
            <p className="git-stats__label">Followers</p>
            <p className="git-stats__value">{state.stats.profile.followers}</p>
          </article>
          <article className="git-stats__card git-stats__card--stat">
            <p className="git-stats__label">Total stars</p>
            <p className="git-stats__value">{totalStars}</p>
          </article>
          <article className="git-stats__card git-stats__card--stat">
            <p className="git-stats__label">Total forks</p>
            <p className="git-stats__value">{totalForks}</p>
          </article>
          <article className="git-stats__card git-stats__card--wide git-stats__card--calendar">
            <div className="git-stats__row">
              <div>
                <p className="git-stats__label">Contributions (last 12 months)</p>
                <p className="git-stats__value">
                  {state.stats.calendar.totalContributions}
                </p>
              </div>
              <a
                className="git-stats__link"
                href={state.stats.profile.url}
                target="_blank"
                rel="noreferrer"
              >
                View profile
              </a>
            </div>
            <div className="git-stats__calendar-row">
              <div className="git-stats__calendar" aria-hidden="true">
                {calendarDays.map(day => {
                  const level = maxContributions
                    ? Math.ceil((day.contributionCount / maxContributions) * 4)
                    : 0;
                  return (
                    <span
                      key={day.date}
                      className={`git-stats__day is-level-${level}`}
                      title={`${day.contributionCount} contributions on ${formatDate(day.date)}`}
                    />
                  );
                })}
              </div>
              <div className="git-stats__spectrum">
                <p className="git-stats__label">Contribution mix</p>
                <div className="git-stats__spectrum-bars" aria-hidden="true">
                  {contributionSpectrum.map(item => (
                    <div key={item.id} className={`git-stats__spectrum-bar is-${item.id}`}>
                      <span
                        style={{
                          height: `${maxSpectrum ? Math.max((item.value / maxSpectrum) * 100, 8) : 8}%`,
                        }}
                      />
                      <span className="git-stats__spectrum-percent">
                        {item.percent.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="git-stats__spectrum-legend">
                  {contributionSpectrum.map(item => (
                    <div key={item.id} className="git-stats__spectrum-item">
                      <span className={`git-stats__spectrum-dot is-${item.id}`} />
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
          <article className="git-stats__card git-stats__card--half">
            <p className="git-stats__label">Top languages</p>
            <div className="git-stats__languages">
              {state.stats.languages.map(language => (
                <div key={language.name} className="git-stats__language">
                  <div className="git-stats__language-head">
                    <span>{language.name}</span>
                    <span>{language.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="git-stats__bar">
                    <span
                      style={{
                        width: `${language.percentage}%`,
                        background: language.color ?? 'var(--primary)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="git-stats__highlights">
              <div className="git-stats__highlight">
                <span className="git-stats__highlight-value">{activeDays}</span>
                <span className="git-stats__highlight-label">Active days</span>
              </div>
              <div className="git-stats__highlight">
                <span className="git-stats__highlight-value">
                  {busiestDay.contributionCount}
                </span>
                <span className="git-stats__highlight-label">Busiest day</span>
              </div>
              <div className="git-stats__highlight">
                <span className="git-stats__highlight-value">
                  {averagePerDay.toFixed(1)}
                </span>
                <span className="git-stats__highlight-label">Avg / day</span>
              </div>
            </div>
            <div className="git-stats__trend">
              <div className="git-stats__trend-head">
                <span>Weekly contribution trend</span>
                <span>{weeklyTotals.length}w</span>
              </div>
              <div className="git-stats__trend-bars" aria-hidden="true">
                {weeklyTotals.map((total, index) => (
                  <span
                    key={`${total}-${index}`}
                    className="git-stats__trend-bar"
                    style={{
                      height: `${maxWeekly ? Math.max((total / maxWeekly) * 100, 6) : 6}%`,
                    }}
                    title={`${total} contributions`}
                  />
                ))}
              </div>
            </div>
            <div className="git-stats__weekday">
              <div className="git-stats__trend-head">
                <span>Weekday focus</span>
                <span>Share</span>
              </div>
              <div className="git-stats__weekday-bars">
                {weekdayDistribution.map(item => (
                  <div key={item.label} className="git-stats__weekday-item">
                    <span className="git-stats__weekday-label">{item.label}</span>
                    <span
                      className="git-stats__weekday-bar"
                      style={{
                        width: `${item.percent}%`,
                      }}
                    />
                    <span className="git-stats__weekday-value">
                      {item.percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="git-stats__achievements">
              <div className="git-stats__trend-head">
                <span>Git achievements</span>
                <span>Last 12 months</span>
              </div>
              <div className="git-stats__achievement-grid">
                <div className="git-stats__achievement">
                  <span className="git-stats__achievement-title">Longest streak</span>
                  <span className="git-stats__achievement-value">{longestStreak} days</span>
                </div>
                <div className="git-stats__achievement">
                  <span className="git-stats__achievement-title">Best week</span>
                  <span className="git-stats__achievement-value">{bestWeek} commits</span>
                </div>
                <div className="git-stats__achievement">
                  <span className="git-stats__achievement-title">Top weekday</span>
                  <span className="git-stats__achievement-value">
                    {topWeekday.label} · {topWeekday.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="git-stats__achievement">
                  <span className="git-stats__achievement-title">Contributions</span>
                  <span className="git-stats__achievement-value">
                    {state.stats.calendar.totalContributions} total
                  </span>
                </div>
              </div>
            </div>
          </article>
          <article className="git-stats__card git-stats__card--half">
            <p className="git-stats__label">Recent commits</p>
            <div className="git-stats__activity">
              {state.stats.recentActivity.length === 0 && (
                <div className="git-stats__empty">No recent commit activity found.</div>
              )}
              {state.stats.recentActivity.map(item => (
                <a key={`${item.repo}-${item.url}`} href={item.url} target="_blank" rel="noreferrer">
                  <div>
                    <span className="git-stats__repo-name">{item.title}</span>
                    <span className="git-stats__repo-meta">
                      {item.repo} · {item.branch} · {formatDate(item.date)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </article>
          <article className="git-stats__card git-stats__card--wide">
            <p className="git-stats__label">Pinned repos</p>
            <div className="git-stats__repos">
              {state.stats.pinnedRepos.map(repo => (
                <a key={repo.name} href={repo.url} target="_blank" rel="noreferrer">
                  <div>
                    <span className="git-stats__repo-name">{repo.name}</span>
                    {repo.description && (
                      <span className="git-stats__repo-desc">{repo.description}</span>
                    )}
                    <span className="git-stats__repo-meta">
                      {repo.primaryLanguage?.name ?? 'Misc'} · {repo.stargazerCount}★
                    </span>
                  </div>
                  <span className="git-stats__repo-updated">
                    Updated {formatDate(repo.updatedAt)}
                  </span>
                </a>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

export default GitStats;
