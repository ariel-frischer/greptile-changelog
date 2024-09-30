import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  changelog: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const { startDate, endDate, gitRepo } = req.body

    if (!startDate || !endDate || !gitRepo) {
      return res.status(400).json({ changelog: 'Missing required parameters' })
    }

    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      return res.status(500).json({ changelog: 'Server configuration error' })
    }

    try {
      const [owner, repo] = gitRepo.split('/').slice(-2)
      console.warn(': generate-changelog.ts:22: owner=', owner)

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

      const commits = await response.json()
      console.warn(': generate-changelog.ts:38: commits=', commits)

      const changelog = commits
        .map((commit: any) => {
          return `- ${commit.commit.message} (${commit.sha.substring(0, 7)})`
        })
        .join('\n')

      res.status(200).json({ changelog })
    } catch (error) {
      console.error('Error generating changelog:', error)
      res.status(500).json({ changelog: 'Failed to generate changelog' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
