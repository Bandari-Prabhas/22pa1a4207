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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-extrabold mb-2 sm:mb-0">SwiftLink</h1>
          <nav className="space-x-4">
            <button
              className={`px-5 py-2 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'shortener' ? 'bg-white text-purple-700 shadow-md' : 'hover:bg-purple-700 hover:text-white'
              }`}
              onClick={() => setActiveTab('shortener')}
            >
              Shorten URL
            </button>
            <button
              className={`px-5 py-2 rounded-full text-lg font-medium transition-all duration-300 ${
                activeTab === 'statistics' ? 'bg-white text-purple-700 shadow-md' : 'hover:bg-purple-700 hover:text-white'
              }`}
              onClick={() => setActiveTab('statistics')}
            >
              Statistics
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto mt-10 p-4">
        {activeTab === 'shortener' && (
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Shorten Your URLs Instantly</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-3 rounded-lg relative mb-6 text-center">
                {error}
              </div>
            )}
            {urls.map((urlEntry) => (
              <div key={urlEntry.id} className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <div className="mb-5">
                  <label htmlFor={`originalUrl-${urlEntry.id}`} className="block text-gray-700 text-sm font-semibold mb-2">
                    Original Long URL
                  </label>
                  <input
                    type="text"
                    id={`originalUrl-${urlEntry.id}`}
                    className="form-input mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g., https://very-long-url.com/path/to/resource"
                    value={urlEntry.originalUrl}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'originalUrl', e.target.value)}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor={`validity-${urlEntry.id}`} className="block text-gray-700 text-sm font-semibold mb-2">
                    Validity in Minutes (optional, default 30)
                  </label>
                  <input
                    type="number"
                    id={`validity-${urlEntry.id}`}
                    className="form-input mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g., 60"
                    value={urlEntry.validity}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'validity', e.target.value)}
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor={`shortcode-${urlEntry.id}`} className="block text-gray-700 text-sm font-semibold mb-2">
                    Custom Shortcode (optional, alphanumeric)
                  </label>
                  <input
                    type="text"
                    id={`shortcode-${urlEntry.id}`}
                    className="form-input mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="e.g., mycustomlink"
                    value={urlEntry.shortcode}
                    onChange={(e) => handleUrlChange(urlEntry.id, 'shortcode', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md"
                onClick={addUrlField}
              >
                Add Another URL
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Shortening...' : 'Shorten All'}
              </button>
            </div>

            {results.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-5 text-center">Shortened URLs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result, index) => (
                    <div key={index} className="bg-purple-50 p-6 rounded-lg shadow-lg border border-purple-200">
                      <p className="text-gray-700 text-sm mb-2 truncate">Original: <span className="font-medium">{result.originalUrl}</span></p>
                      <p className="text-purple-700 text-lg font-semibold break-words">
                        Short Link: <a href={result.shortLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">{result.shortLink}</a>
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        Expires: {new Date(result.expiry).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">URL Statistics</h2>
            {loading && <p className="text-center text-gray-600">Loading statistics...</p>}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-5 py-3 rounded-lg relative mb-6 text-center">
                {error}
              </div>
            )}
            {statistics.length === 0 && !loading && !error && (
              <p className="text-gray-600 text-center">No statistics available. Shorten some URLs first.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statistics.map((stat, index) => (
                <div key={index} className="bg-blue-50 p-6 rounded-lg shadow-lg border border-blue-200">
                  <p className="text-xl font-bold text-blue-800 mb-2">Short Link: <span className="font-mono">{BACKEND_URL}/{stat.shortcode}</span></p>
                  <p className="text-gray-700 text-sm mb-1 truncate">Original URL: <span className="font-medium">{stat.originalUrl}</span></p>
                  <p className="text-gray-500 text-xs">Created At: {new Date(stat.createdAt).toLocaleString()}</p>
                  <p className="text-gray-500 text-xs mb-3">Expires At: {new Date(stat.expiryAt).toLocaleString()}</p>
                  <p className="text-gray-800 font-extrabold text-2xl">Clicks: {stat.totalClicks}</p>
                  {stat.detailedClicks && stat.detailedClicks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <h4 className="text-md font-semibold text-gray-700 mb-2">Detailed Clicks:</h4>
                      <ul className="space-y-1 text-xs text-gray-600 max-h-24 overflow-y-auto custom-scrollbar">
                        {stat.detailedClicks.map((click, clickIndex) => (
                          <li key={clickIndex} className="bg-blue-100 p-2 rounded-md">
                            <p><strong>Time:</strong> {new Date(click.timestamp).toLocaleString()}</p>
                            <p><strong>Referrer:</strong> {click.referrer || 'N/A'}</p>
                            <p><strong>IP:</strong> {click.ip || 'N/A'}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
