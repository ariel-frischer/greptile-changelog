import { useState, useEffect } from 'react';
import { NextPage } from 'next';

const ChangelogPage: NextPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [gitRepo, setGitRepo] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setGitRepo('https://github.com/ariel-frischer/bulk-ticket-generator');
      setStartDate('2023-09-22T18:00');
      setEndDate('2023-09-22T23:10');
    }
  }, []);

  const handleGenerateChangelog = async () => {
    try {
      const response = await fetch('/api/generate-changelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate, gitRepo }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        throw new Error('Failed to generate changelog');
      }
    } catch (error) {
      console.error('Error generating changelog:', error);
      alert('Failed to generate changelog');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Changelog</h1>
        <div>
          <label htmlFor="gitRepo" className="block mb-1">Git Repository:</label>
          <input
            type="text"
            id="gitRepo"
            value={gitRepo}
            onChange={(e) => setGitRepo(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://github.com/username/repo.git"
          />
        </div>
      <div className="space-y-4">
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
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Generate Changelog
        </button>
      </div>
    </div>
  );
};

export default ChangelogPage;
