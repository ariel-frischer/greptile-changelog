import type { NextApiRequest, NextApiResponse } from 'next'

type Commit = {
  sha: string;
  commit: {
    message: string;
  };
}

type CommitWithDiff = Commit & {
  diff: string;
}

type Data = {
  changelog: CommitWithDiff[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const { startDate, endDate, gitRepo } = req.body

    if (!startDate || !endDate || !gitRepo) {
      return res.status(400).json({ changelog: [] })
    }

    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return res.status(500).json({ changelog: [] })
    }

    try {
      const [owner, repo] = gitRepo.split('/').slice(-2)

      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${startDate}&until=${endDate}`

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        throw new Error(`GitHub API responded with status ${response.status}`)
      }

      const commits: Commit[] = await response.json()

      const commitsWithDiffs: CommitWithDiff[] = await Promise.all(
        commits.map(async (commit) => {
          const diffUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`
          const diffResponse = await fetch(diffUrl, {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3.diff',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          })

          if (!diffResponse.ok) {
            throw new Error(`GitHub API responded with status ${diffResponse.status} for diff`)
          }

          const diff = await diffResponse.text()

          return {
            ...commit,
            diff,
          }
        })
      )

      res.status(200).json({ changelog: commitsWithDiffs })
    } catch (error) {
      console.error('Error generating changelog:', error)
      res.status(500).json({ changelog: [] })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
