'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  ThumbsUp,
  Copy,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  name: string;
  tag?: string;
  votes_count: number;
  created_at: string;
  updated_at?: string;
  is_owner: boolean;
  has_upvoted: boolean;
}

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('hot');
  const [timeRange, setTimeRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [editLinkShown, setEditLinkShown] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    prompt_text: '',
    name: '',
    tag: '',
    honeypot: '',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [activeTab, timeRange]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/prompts?sort=${activeTab}&range=${timeRange}`
      );
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      showToast('Failed to load prompts.', 'error');
    }
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to submit.', 'error');
        return;
      }

      showToast('Posted! Here\'s your edit link—copy it now.', 'success');
      setEditLinkShown(data.edit_url);
      setFormData({
        title: '',
        prompt_text: '',
        name: '',
        tag: '',
        honeypot: '',
      });
      fetchPrompts();
    } catch (error) {
      showToast('Failed to submit prompt.', 'error');
    }
  };

  const handleUpvote = async (promptId: string) => {
    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to upvote.', 'error');
        return;
      }

      showToast('Upvoted.', 'success');
      
      setPrompts(prev =>
        prev.map(p =>
          p.id === promptId
            ? { ...p, votes_count: data.votes_count, has_upvoted: true }
            : p
        )
      );
    } catch (error) {
      showToast('Failed to upvote.', 'error');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`, 'success');
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 1000
    );
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const clampText = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredPrompts = prompts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.prompt_text.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.tag && p.tag.toLowerCase().includes(q))
    );
  });

  const getEmptyState = () => {
    if (activeTab === 'hot') {
      return 'No fire yet. Be the spark—share or upvote something good.';
    } else if (activeTab === 'top') {
      return 'Nothing\'s topping the charts yet.';
    } else {
      return 'Fresh board. Post the first prompt!';
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark'
          ? 'bg-gray-900 text-white'
          : 'bg-gray-50 text-gray-900'
      }`}
    >
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white max-w-md`}
        >
          {toast.message}
        </div>
      )}

      {editLinkShown && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setEditLinkShown(null)}
        >
          <div
            className={`max-w-md w-full rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">Your Edit Link</h3>
            <p className="text-sm mb-4 opacity-70">
              Save this link to edit your prompt later. It won't be shown again!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={editLinkShown}
                readOnly
                className={`flex-1 px-3 py-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-100 border-gray-300'
                } text-sm`}
              />
              <button
                onClick={() => copyToClipboard(editLinkShown, 'Edit link')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setEditLinkShown(null)}
              className="mt-4 w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 border-b ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">PromptBoard</h1>
              <p className="text-sm opacity-70">
                Simple, public, no-login prompt sharing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-300 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                />
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside
            className={`lg:col-span-1 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } rounded-lg border p-6 h-fit sticky top-24`}
          >
            <h2 className="text-xl font-bold mb-4">Share a prompt</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  maxLength={120}
                  required
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Brief, clear title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prompt *
                </label>
                <textarea
                  value={formData.prompt_text}
                  onChange={(e) =>
                    setFormData({ ...formData, prompt_text: e.target.value })
                  }
                  maxLength={5000}
                  required
                  rows={6}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Your prompt text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  maxLength={60}
                  required
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="How you'd like to be credited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tag (optional)
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  maxLength={30}
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., coding, writing"
                />
              </div>
              <input
                type="text"
                value={formData.honeypot}
                onChange={(e) =>
                  setFormData({ ...formData, honeypot: e.target.value })
                }
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
              >
                Submit Prompt
              </button>
              <p className="text-xs opacity-70">
                Keep it helpful. No spam, no personal data.
              </p>
            </form>
          </aside>

          <main className="lg:col-span-2">
            <div
              className={`rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              } mb-6`}
            >
              <div className="flex items-center gap-2 p-2 border-b border-opacity-20">
                {['hot', 'top', 'new'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded font-medium capitalize transition ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'top' && (
                <div className="flex gap-2 p-2">
                  {['all', '7d', '24h'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        timeRange === range
                          ? theme === 'dark'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-blue-100 text-blue-700'
                          : theme === 'dark'
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {range === 'all' ? 'All time' : range}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-12 opacity-70">
                Loading prompts...
              </div>
            )}

            {!loading && filteredPrompts.length === 0 && (
              <div className="text-center py-12 opacity-70">
                {searchQuery
                  ? 'No prompts match your search.'
                  : getEmptyState()}
              </div>
            )}

            <div className="space-y-4">
              {filteredPrompts.map((prompt) => {
                const isExpanded = expandedCards.has(prompt.id);
                const needsExpand = prompt.prompt_text.length > 200;

                return (
                  <div
                    key={prompt.id}
                    className={`rounded-lg border p-5 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    } hover:shadow-lg transition cursor-pointer`}
                    onClick={(e) => {
                      if (!e.target.closest('button')) {
                        setSelectedPrompt(prompt);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold mb-2">
                          {prompt.title}
                        </h3>
                        <p
                          className={`mb-3 whitespace-pre-wrap ${
                            theme === 'dark'
                              ? 'text-gray-300'
                              : 'text-gray-700'
                          }`}
                        >
                          {isExpanded
                            ? prompt.prompt_text
                            : clampText(prompt.prompt_text)}
                        </p>
                        {needsExpand && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(prompt.id);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Show less <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {prompt.tag && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                theme === 'dark'
                                  ? 'bg-blue-900 text-blue-200'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {prompt.tag}
                            </span>
                          )}
                          <span className="opacity-70">by {prompt.name}</span>
                          <span className="opacity-50">
                            · {formatTimeAgo(prompt.created_at)}
                          </span>
                          {prompt.is_owner && (
                            <a
                              href={`/edit?id=${prompt.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!prompt.has_upvoted) {
                            handleUpvote(prompt.id);
                          }
                        }}
                        disabled={prompt.has_upvoted}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                          prompt.has_upvoted
                            ? 'opacity-50 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <ThumbsUp
                          className={`w-5 h-5 ${
                            prompt.has_upvoted ? 'fill-current' : ''
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {prompt.votes_count}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      {selectedPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className={`max-w-2xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold pr-8">
                {selectedPrompt.title}
              </h2>
              <button
                onClick={() => setSelectedPrompt(null)}
                className={`p-2 rounded ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p
              className={`mb-4 whitespace-pre-wrap ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {selectedPrompt.prompt_text}
            </p>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() =>
                  copyToClipboard(selectedPrompt.title, 'Title')
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Copy className="w-4 h-4" /> Copy Title
              </button>
              <button
                onClick={() =>
                  copyToClipboard(selectedPrompt.prompt_text, 'Prompt')
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Copy className="w-4 h-4" /> Copy Prompt
              </button>
            </div>
            <div className="text-sm opacity-70 flex items-center gap-2 flex-wrap">
              {selectedPrompt.tag && (
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    theme === 'dark'
                      ? 'bg-blue-900 text-blue-200'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedPrompt.tag}
                </span>
              )}
              <span>by {selectedPrompt.name}</span>
              <span>· {formatTimeAgo(selectedPrompt.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}