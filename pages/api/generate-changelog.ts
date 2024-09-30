import type { NextApiRequest, NextApiResponse } from 'next';
import GreptileAPI from '../../utils/GreptileAPI';

type Data = {
  changelog: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const { startDate, endDate, gitRepo } = req.body;

    if (!startDate || !endDate || !gitRepo) {
      return res.status(400).json({ changelog: 'Missing required parameters' });
    }

    const greptileApiKey = process.env.GREPTILE_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!greptileApiKey || !githubToken) {
      return res.status(500).json({ changelog: 'Server configuration error' });
    }

    const greptileAPI = new GreptileAPI(greptileApiKey, githubToken);

    try {
      const [remote, repository] = gitRepo.split('/').slice(-2);
      const branch = 'main'; // Assuming main branch, adjust if needed

      await greptileAPI.ensureRepositoryIndexed(remote, repository, branch);

      const query = `Generate a changelog for the repository ${gitRepo} between ${startDate} and ${endDate}. Include commit messages and a summary of changes for each commit.`;

      const response = await greptileAPI.query(
        [{ role: 'user', content: query }],
        [{ remote, repository, branch }]
      );

      res.status(200).json({ changelog: response.choices[0].message.content });
    } catch (error) {
      console.error('Error generating changelog:', error);
      res.status(500).json({ changelog: 'Failed to generate changelog' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
