// app/edit/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function EditPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    prompt_text: '',
    name: '',
    tag: '',
  });

  const id = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    if (!id || !token) {
      showToast('Invalid edit link.', 'error');
      setTimeout(() => router.push('/'), 2000);
      return;
    }
    fetchPrompt();
  }, [id, token]);

  const fetchPrompt = async () => {
    try {
      const res = await fetch(`/api/prompts?sort=new`);
      const data = await res.json();
      const prompt = data.prompts.find((p: any) => p.id === id);

      if (!prompt) {
        showToast('Prompt not found.', 'error');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      setFormData({
        title: prompt.title,
        prompt_text: prompt.prompt_text,
        name: prompt.name,
        tag: prompt.tag || '',
      });
    } catch (error) {
      showToast('Failed to load prompt.', 'error');
    }
    setLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          edit_token: token,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to save.', 'error');
        setSaving(false);
        return;
      }

      showToast('Saved changes.', 'success');
      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      showToast('Failed to save changes.', 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 mb-6 opacity-70 hover:opacity-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to PromptBoard
        </button>

        <div
          className={`rounded-lg border p-6 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <h1 className="text-2xl font-bold mb-6">Edit Your Prompt</h1>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
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
                rows={10}
                className={`w-full px-3 py-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditPageContent />
    </Suspense>
  );
}