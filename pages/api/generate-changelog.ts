import type { NextApiRequest, NextApiResponse } from 'next'
import GreptileAPI from '../../utils/GreptileAPI'

type Commit = {
  sha: string
  commit: {
    message: string
  }
}

type CommitWithDiff = Commit & {
  diff: string
}

type Data = {
  changelog: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const { startDate, endDate, gitRepo } = req.body

    if (!startDate || !endDate || !gitRepo) {
      return res.status(400).json({ changelog: '' })
    }

    const githubToken = process.env.GITHUB_TOKEN
    const greptileApiKey = process.env.GREPTILE_API_KEY

    if (!githubToken || !greptileApiKey) {
      return res.status(500).json({ changelog: '' })
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

      const greptileAPI = new GreptileAPI(greptileApiKey, githubToken)
      const repositories = [
        {
          remote: 'github',
          repository: gitRepo,
          branch: 'dev',
        },
      ]

      const messages = [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates changelogs. Focus on non-technical changes and use the correct markdown changelog format with datetimes.',
        },
        {
          role: 'user',
          content: `Generate a changelog for the following commits:\n\n${JSON.stringify(commitsWithDiffs, null, 2)}`,
        },
      ]

      const greptileResponse = await greptileAPI.query(messages, repositories)

      res.status(200).json({ changelog: greptileResponse.choices[0].message.content })
    } catch (error) {
      console.error('Error generating changelog:', error)
      res.status(500).json({ changelog: '' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
