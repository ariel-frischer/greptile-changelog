interface Repository {
  remote: string
  repository: string
  branch: string
}

interface Message {
  role: string
  content: string
}

class GreptileAPI {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(greptileApiKey: string, githubToken: string) {
    this.baseUrl = 'https://api.greptile.com/v2'
    this.headers = {
      Authorization: `Bearer ${greptileApiKey}`,
      'X-GitHub-Token': githubToken,
      'Content-Type': 'application/json',
    }
  }

  private async fetchWithErrorHandling(url: string, options: RequestInit): Promise<any> {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  }

  async getRepositoryInfo(repositoryId: string): Promise<any> {
    const url = `${this.baseUrl}/repositories/${repositoryId}`
    return this.fetchWithErrorHandling(url, { headers: this.headers })
  }

  async indexRepository(remote: string, repository: string, branch: string): Promise<any> {
    const url = `${this.baseUrl}/repositories`
    const payload = {
      remote,
      repository,
      branch,
      reload: true,
      notify: true,
    }
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    })
  }

  async isRepositoryIndexed(remote: string, repository: string, branch: string): Promise<boolean> {
    const readableRepositoryId = `${remote}:${branch}:${repository}`
    const repositoryId = encodeURIComponent(readableRepositoryId)

    try {
      const response = await this.getRepositoryInfo(repositoryId)
      return response.status === 'completed'
    } catch (error) {
      if (error instanceof Error && error.message.includes('status: 404')) {
        return false
      }
      throw error
    }
  }

  async ensureRepositoryIndexed(
    remote: string,
    repository: string,
    branch: string
  ): Promise<boolean> {
    if (!(await this.isRepositoryIndexed(remote, repository, branch))) {
      console.log(`Repository ${remote}/${repository} not indexed. Indexing now...`)
      await this.indexRepository(remote, repository, branch)
    }
    return true
  }

  async query(
    messages: Message[],
    repositories: Repository[],
    sessionId?: string,
    stream: boolean = false,
    genius: boolean = true
  ): Promise<any> {
    // for (const repo of repositories) {
    //   await this.ensureRepositoryIndexed(repo.remote, repo.repository, repo.branch);
    // }

    const url = `${this.baseUrl}/query`
    const payload = {
      messages,
      repositories,
      sessionId,
      stream,
      genius,
    }

    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    })
  }
}

export default GreptileAPI
