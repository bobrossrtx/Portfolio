const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

type GraphQLError = {
    message: string;
};

type GraphQLResponse<T> = {
    data?: T;
    errors?: GraphQLError[];
};

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

type GitHubGraphQLUser = {
    name: string | null;
    url: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: {
        totalCount: number;
        nodes: Array<{
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
            languages: {
                edges: Array<{
                    size: number;
                    node: {
                        name: string;
                        color: string | null;
                    } | null;
                }>;
            };
        }>;
    };
    recentRepos: {
        nodes: Array<{
            name: string;
            url: string;
            pushedAt: string | null;
            updatedAt: string;
            defaultBranchRef: {
                name: string;
                target: {
                    history: {
                        nodes: Array<{
                            oid: string;
                            messageHeadline: string;
                            committedDate: string;
                        }>;
                    };
                } | null;
            } | null;
        }>;
    };
    pinnedItems: {
        nodes: Array<
            | {
                    name: string;
                    url: string;
                    description: string | null;
                    stargazerCount: number;
                    updatedAt: string;
                    primaryLanguage: {
                        name: string;
                        color: string | null;
                    } | null;
                }
            | null
        >;
    };
    contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: GitHubCalendar;
    };
};

type GitHubGraphQLData = {
    user: GitHubGraphQLUser | null;
};

const buildLanguages = (repos: GitHubGraphQLUser['repositories']['nodes']) => {
    const totals = new Map<string, { size: number; color: string | null }>();

    repos.forEach(repo => {
        repo.languages.edges.forEach(edge => {
            if (!edge.node) return;
            const name = edge.node.name;
            const existing = totals.get(name);
            const nextSize = (existing?.size ?? 0) + edge.size;
            totals.set(name, {
                size: nextSize,
                color: existing?.color ?? edge.node.color ?? null,
            });
        });
    });

    const totalSize = Array.from(totals.values()).reduce((sum, item) => sum + item.size, 0);

    return Array.from(totals.entries())
        .map(([name, info]) => ({
            name,
            color: info.color,
            size: info.size,
            percentage: totalSize ? (info.size / totalSize) * 100 : 0,
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 6);
};

const buildRecentCommits = (repos: GitHubGraphQLUser['recentRepos']['nodes']) => {
    const commits: GitHubActivity[] = [];

    repos.forEach(repo => {
        const branch = repo.defaultBranchRef;
        const history = branch?.target?.history.nodes ?? [];

        history.forEach(commit => {
            commits.push({
                type: 'commit',
                title: commit.messageHeadline || 'Commit',
                url: `${repo.url}/commit/${commit.oid}`,
                date: commit.committedDate,
                repo: repo.name,
                branch: branch?.name ?? 'main',
            });
        });
    });

    return commits
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 11);
};

export const fetchGitHubStats = async (login: string, token: string | undefined) => {
    if (!token) {
        throw new Error('Missing GitHub token. Add VITE_GITHUB_TOKEN to your env file.');
    }

    const now = new Date();
    const from = new Date(now);
    from.setFullYear(now.getFullYear() - 1);

    const query = `
        query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
                name
                url
                followers { totalCount }
                following { totalCount }
                repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
                    totalCount
                    nodes {
                        name
                        url
                        description
                        stargazerCount
                        forkCount
                        updatedAt
                        primaryLanguage { name color }
                        languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
                            edges { size node { name color } }
                        }
                    }
                }
                recentRepos: repositories(first: 12, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
                    nodes {
                        name
                        url
                        pushedAt
                        updatedAt
                        defaultBranchRef {
                            name
                            target {
                                ... on Commit {
                                    history(first: 5) {
                                        nodes {
                                            oid
                                            messageHeadline
                                            committedDate
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                pinnedItems(first: 6, types: [REPOSITORY]) {
                    nodes {
                        ... on Repository {
                            name
                            url
                            description
                            stargazerCount
                            updatedAt
                            primaryLanguage { name color }
                        }
                    }
                }
                contributionsCollection(from: $from, to: $to) {
                    totalCommitContributions
                    totalPullRequestContributions
                    totalIssueContributions
                    totalPullRequestReviewContributions
                    contributionCalendar {
                        totalContributions
                        weeks { contributionDays { date contributionCount } }
                    }
                }
            }
        }
    `;

    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            query,
            variables: {
                login,
                from: from.toISOString(),
                to: now.toISOString(),
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Unable to load GitHub stats right now.');
    }

    const payload = (await response.json()) as GraphQLResponse<GitHubGraphQLData>;

    if (payload.errors?.length) {
        throw new Error(payload.errors[0]?.message ?? 'Unable to load GitHub stats right now.');
    }

    if (!payload.data?.user) {
        throw new Error('Unable to load GitHub stats right now.');
    }

    const user = payload.data.user;
    const repos = user.repositories.nodes;
    const languages = buildLanguages(repos);
    const recentActivity = buildRecentCommits(user.recentRepos.nodes);
    const pinnedRepos = user.pinnedItems.nodes
        .filter((repo): repo is NonNullable<typeof repo> => Boolean(repo))
        .map(repo => ({
            name: repo.name,
            url: repo.url,
            description: repo.description,
            stargazerCount: repo.stargazerCount,
            forkCount: 0,
            updatedAt: repo.updatedAt,
            primaryLanguage: repo.primaryLanguage,
        }));

    return {
        profile: {
            name: user.name ?? login,
            url: user.url,
            followers: user.followers.totalCount,
            following: user.following.totalCount,
            publicRepos: user.repositories.totalCount,
        },
        repos: repos.map(repo => ({
            name: repo.name,
            url: repo.url,
            description: repo.description,
            stargazerCount: repo.stargazerCount,
            forkCount: repo.forkCount,
            updatedAt: repo.updatedAt,
            primaryLanguage: repo.primaryLanguage,
        })),
        pinnedRepos,
        recentActivity,
        languages,
        calendar: user.contributionsCollection.contributionCalendar,
        contributionTotals: {
            commits: user.contributionsCollection.totalCommitContributions,
            pullRequests: user.contributionsCollection.totalPullRequestContributions,
            issues: user.contributionsCollection.totalIssueContributions,
            reviews: user.contributionsCollection.totalPullRequestReviewContributions,
        },
    } satisfies GitHubStats;
};
