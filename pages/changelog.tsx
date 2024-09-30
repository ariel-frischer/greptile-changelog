import { useState, useEffect } from 'react';
import { NextPage } from 'next';

const ChangelogPage: NextPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gitRepo, setGitRepo] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setGitRepo('ariel-frischer/bulk-ticket-generator');
      setStartDate('2024-09-22T18:00');
      setEndDate('2024-09-22T23:10');
    }
  }, []);

  const [changelog, setChangelog] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateChangelog = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          gitRepo
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChangelog(data.changelog);
      } else {
        throw new Error('Failed to generate changelog');
      }
    } catch (error) {
      console.error('Error generating changelog:', error);
      alert('Failed to generate changelog');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Changelog</h1>
      <div>
        <label htmlFor="gitRepo" className="block mb-1">Git Repository (owner/repo):</label>
        <input
          type="text"
          id="gitRepo"
          value={gitRepo}
          onChange={(e) => setGitRepo(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="octocat/Hello-World"
        />
      </div>
      <div className="space-y-4 mt-4">
        <div>
          <label htmlFor="startDate" className="block mb-1">Start Date:</label>
          <input
            type="datetime-local"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block mb-1">End Date:</label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          onClick={handleGenerateChangelog}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Changelog'}
        </button>
      </div>
      {changelog && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Changelog:</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{changelog}</pre>
        </div>
      )}
    </div>
  );
};

export default ChangelogPage;
