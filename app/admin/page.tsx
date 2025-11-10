'use client';

import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    if (token.length > 10) {
      setAuthenticated(true);
      fetchPrompts();
    }
  };

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompts?sort=new&limit=50');
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      alert('Failed to load prompts');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, is_deleted: boolean) => {
    console.log('Deleting with token:', token); // Debug log
    try {
      const res = await fetch('/api/admin/delete_prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, is_deleted: !is_deleted }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Failed to delete: ${data.error}`);
        return;
      }
      
      fetchPrompts();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    }
  };

  const handleWipeVotes = async (id: string) => {
    if (!confirm('Wipe all votes for this prompt?')) return;
    try {
      const res = await fetch('/api/admin/wipe_votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
        return;
      }
      
      fetchPrompts();
    } catch (error) {
      alert('Failed to wipe votes');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-white">Admin Access</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="Admin token"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAuth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">PromptBoard Admin</h1>
          <button
            onClick={fetchPrompts}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading && <div>Loading...</div>}

        <div className="space-y-4">
          {prompts.map((p) => (
            <div
              key={p.id}
              className={`bg-gray-800 border ${
                p.is_deleted ? 'border-red-500' : 'border-gray-700'
              } rounded-lg p-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {p.prompt_text}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>by {p.name}</span>
                    {p.tag && (
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                        {p.tag}
                      </span>
                    )}
                    <span>Votes: {p.votes_count}</span>
                    {p.is_deleted && (
                      <span className="text-red-400 font-bold">DELETED</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(p.id, p.is_deleted)}
                    className={`p-2 rounded ${
                      p.is_deleted
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                    title={p.is_deleted ? 'Restore' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleWipeVotes(p.id)}
                    className="px-3 py-1 text-yellow-400 hover:text-yellow-300 text-sm"
                  >
                    Wipe Votes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}