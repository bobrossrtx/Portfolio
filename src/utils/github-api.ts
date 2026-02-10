export type GitHubLanguage = {
    name: string;
    color: string | null;
    size: number;
    percentage: number;
};

export type GitHubRepo = {
    name: string;
    url: string;
    description: string | null;
    stargazerCount: number;
    forkCount: number;
    updatedAt: string;
    primaryLanguage: {
        name: string;
        color: string | null;
    } | null;
};

export type GitHubActivity = {
    type: 'commit';
    title: string;
    url: string;
    date: string;
    repo: string;
    branch: string;
};

export type GitHubCalendar = {
    totalContributions: number;
    weeks: Array<{
        contributionDays: Array<{
            date: string;
            contributionCount: number;
        }>;
    }>;
};

export type GitHubStats = {
    profile: {
        name: string;
        url: string;
        followers: number;
        following: number;
        publicRepos: number;
    };
    repos: GitHubRepo[];
    pinnedRepos: GitHubRepo[];
    recentActivity: GitHubActivity[];
    languages: GitHubLanguage[];
    calendar: GitHubCalendar;
    contributionTotals: {
        commits: number;
        pullRequests: number;
        issues: number;
        reviews: number;
    };
};

export const fetchGitHubStats = async (login: string) => {
    const response = await fetch(`/api/github-stats?login=${encodeURIComponent(login)}`);

    if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to load GitHub stats right now.');
    }

    const payload = (await response.json()) as GitHubStats;
    return payload;
};
