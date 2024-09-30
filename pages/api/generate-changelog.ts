import type { NextApiRequest, NextApiResponse } from 'next'
import GreptileAPI from '../../utils/GreptileAPI'

type Data = {
  changelog: string;
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
      const greptileAPI = new GreptileAPI(greptileApiKey, githubToken)

      // Fetch commits and diffs from GitHub API
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

      // Prepare messages for Greptile API
      const messages = [
        {
          role: 'system',
          content: 'You are a changelog generator. Given a list of commits and their diffs, generate a non-technical changelog in correct markdown format with datetimes. Focus on user-facing changes and improvements.'
        },
        {
          role: 'user',
          content: `Generate a changelog for the following commits:\n\n${commits.map(commit => 
            `Commit: ${commit.sha}\nMessage: ${commit.commit.message}\nDate: ${commit.commit.author.date}\n\nDiff:\n${commit.diff || 'No diff available'}\n\n`
          ).join('\n')}`
        }
      ]

      // Query Greptile API
      const greptileResponse = await greptileAPI.query(
        messages,
        [{ remote: 'github', repository: `${owner}/${repo}`, branch: 'main' }],
        undefined,
        false,
        true
      )

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
