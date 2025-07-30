import React, { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [urls, setUrls] = useState([{ id: 1, originalUrl: '', validity: 30, shortcode: '' }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState([]);
  const [activeTab, setActiveTab] = useState('shortener');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const statsPromises = results.map(async (res) => {
        const shortcode = res.shortLink.split('/').pop();
        try {
          const statResponse = await fetch(`${BACKEND_URL}/shorturls/${shortcode}`);
          if (!statResponse.ok) {
            throw new Error(`HTTP error! status: ${statResponse.status}`);
          }
          return await statResponse.json();
        } catch (statErr) {
          return null;
        }
      });
      const fetchedStats = (await Promise.all(statsPromises)).filter(Boolean);
      setStatistics(fetchedStats);
    } catch (err) {
      setError('Failed to fetch statistics.');
    } finally {
      setLoading(false);
    }
  }, [results]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab, fetchStatistics]);

  const handleUrlChange = (id, field, value) => {
    setUrls((prevUrls) =>
      prevUrls.map((url) => (url.id === id ? { ...url, [field]: value } : url))
    );
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls((prevUrls) => [
        ...prevUrls,
        { id: prevUrls.length + 1, originalUrl: '', validity: 30, shortcode: '' },
      ]);
    } else {
      setError('You can only shorten up to 5 URLs at a time.');
    }
  };

  const validateInput = (urlEntry) => {
    if (!urlEntry.originalUrl) {
      return 'Original URL is required.';
    }
    try {
      new URL(urlEntry.originalUrl);
    } catch (_) {
      return 'Invalid URL format.';
    }
    if (urlEntry.validity && (isNaN(urlEntry.validity) || urlEntry.validity <= 0)) {
      return 'Validity must be a positive integer.';
    }
    if (urlEntry.shortcode && !/^[a-zA-Z0-9]+$/.test(urlEntry.shortcode)) {
      return 'Custom shortcode must be alphanumeric.';
    }
    return '';
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    setResults([]);

    const newResults = [];
    for (const urlEntry of urls) {
      const validationError = validateInput(urlEntry);
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      try {
        const payload = {
          url: urlEntry.originalUrl,
          validity: urlEntry.validity ? parseInt(urlEntry.validity) : undefined,
          shortcode: urlEntry.shortcode || undefined,
        };
        const response = await fetch(`${BACKEND_URL}/shorturls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        newResults.push({ ...data, originalUrl: urlEntry.originalUrl });
      } catch (err) {
        const errorMessage = err.message;
        setError(`Failed to shorten ${urlEntry.originalUrl}: ${errorMessage}`);
        break;
      }
    }
    setResults(newResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">URL Shortener</h1>
          <div>
            <button
              className={`px-4 py-2 rounded-md mr-2 ${
                activeTab === 'shortener' ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
              onClick={() => setActiveTab('shortener')}
            >
              Shorten URL
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'statistics' ? 'bg-blue-800' : 'hover:bg-blue-700'
              }`}
              onClick={() => setActiveTab('statistics')}
            >
              Statistics
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto mt-8 p-4">
        {activeTab === 'shortener' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Shorten Your URLs</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}
            {urls.map((urlEntry) => (
              <div key={urlEntry.id} className="mb-6 border border-gray-200 p-4 rounded-md">
                <div className="mb-4">
                  <label htmlFor={`originalUrl-${urlEntry.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                    Original Long URL
                  </label>
                  <input
                    type="text"
                    id={`originalUrl-${urlEntry.id}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={urlEntry.originalUrl}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'originalUrl', e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor={`validity-${urlEntry.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                    Validity in Minutes (optional, default 30)
                  </label>
                  <input
                    type="number"
                    id={`validity-${urlEntry.id}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={urlEntry.validity}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'validity', e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor={`shortcode-${urlEntry.id}`} className="block text-gray-700 text-sm font-bold mb-2">
                    Custom Shortcode (optional, alphanumeric)
                  </label>
                  <input
                    type="text"
                    id={`shortcode-${urlEntry.id}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={urlEntry.shortcode}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'shortcode', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              onClick={addUrlField}
            >
              Add Another URL
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Shortening...' : 'Shorten All'}
            </button>

            {results.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Shortened URLs</h3>
                <ul className="list-disc pl-5">
                  {results.map((result, index) => (
                    <li key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
                      <p className="text-gray-800">Original: {result.originalUrl}</p>
                      <p className="text-blue-600">
                        Short Link: <a href={result.shortLink} target="_blank" rel="noopener noreferrer" className="underline">{result.shortLink}</a>
                      </p>
                      <p className="text-gray-500 text-sm">
                        Expires: {new Date(result.expiry).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">URL Statistics</h2>
            {loading && <p>Loading statistics...</p>}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}
            {statistics.length === 0 && !loading && !error && (
              <p className="text-gray-600">No statistics available. Shorten some URLs first.</p>
            )}
            <ul className="list-disc pl-5">
              {statistics.map((stat, index) => (
                <li key={index} className="mb-4 border border-gray-200 p-4 rounded-md">
                  <p className="text-lg font-medium">Short Link: {BACKEND_URL}/{stat.shortcode}</p>
                  <p className="text-gray-700">Original URL: {stat.originalUrl}</p>
                  <p className="text-gray-500 text-sm">Created At: {new Date(stat.createdAt).toLocaleString()}</p>
                  <p className="text-gray-500 text-sm">Expires At: {new Date(stat.expiryAt).toLocaleString()}</p>
                  <p className="text-gray-700 font-semibold">Total Clicks: {stat.totalClicks}</p>
                  {stat.detailedClicks && stat.detailedClicks.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-md font-semibold">Detailed Clicks:</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {stat.detailedClicks.map((click, clickIndex) => (
                          <li key={clickIndex}>
                            Timestamp: {new Date(click.timestamp).toLocaleString()}, Referrer: {click.referrer}, IP: {click.ip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
