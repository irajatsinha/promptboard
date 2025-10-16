# PromptBoard

Simple, public, no-login prompt sharing platform.

## Features

- 🚀 Submit prompts without login
- 👍 Upvote prompts (one per IP per prompt)
- ✏️ Edit your own submissions via secret link
- 🔥 Hot/Top/New sorting with Wilson scoring
- 🌓 Light/dark mode
- 📱 Fully responsive
- 🔒 Privacy-first (no raw IP storage)
- 🛡️ Anti-spam protection

## Quick Deploy (Non-Coder Guide)

### Step 1: Create Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose a name, password, and region
4. Wait for setup to complete (~2 minutes)
5. Go to "SQL Editor" in the left sidebar
6. Copy the entire SQL migration from `supabase_migration.sql` above
7. Paste into the editor and click "Run"

### Step 2: Get Database Connection String

1. In Supabase, go to "Project Settings" (gear icon)
2. Click "Database" in the left menu
3. Scroll to "Connection string"
4. Select "URI" tab
5. Copy the connection string (looks like: `postgresql://...`)
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New" → "Project"
3. Import your PromptBoard repository from GitHub
4. In "Configure Project":
   - Framework Preset: **Next.js**
   - Build Command: (leave default)
   - Output Directory: (leave default)

5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...  (paste from Step 2)
   ADMIN_TOKEN=create-a-long-random-password-here
   IP_SALT=another-random-string-for-ip-hashing
   NEXT_PUBLIC_ANALYTICS=false
   ```

6. Click "Deploy"
7. Wait 2-3 minutes for deployment

### Step 4: Set Up Cron Job (Hot Score Updates)

1. After deployment, go to your Vercel project dashboard
2. Click "Settings" → "Cron Jobs"
3. Click "Create Cron Job"
4. Set:
   - **Path**: `/api/admin/recompute_hot?token=YOUR_ADMIN_TOKEN_HERE`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
5. Save

### Step 5: Test Your Site

1. Visit your deployed URL (Vercel will show it)
2. Submit a test prompt
3. **IMPORTANT**: Copy the edit link shown after submitting!
4. Test upvoting
5. Test editing via the link

### Step 6: Access Admin Panel (Optional)

1. Go to `your-site.vercel.app/admin`
2. Enter your `ADMIN_TOKEN`
3. You can now:
   - Delete/undelete prompts
   - Wipe votes
   - View all submissions

## How It Works

- **No user accounts**: Submit and edit via secret tokens stored in cookies
- **Privacy**: Your IP is hashed with a salt before storage (one-way, can't be reversed)
- **Spam protection**: Rate limiting (10 posts/hour per IP) + honeypot + profanity filter
- **Fair voting**: Wilson confidence scoring prevents new posts with 1 vote from dominating
- **Time decay**: Hot sorting gently ages posts (half-life ~2 days)

## Safety Notes

### What We Store
- Hashed IPs (SHA-256 with salt) - **not reversible**
- Prompt content, name, tag
- Vote counts
- Edit tokens (UUID) => setSearchQuery(e.target.value)}
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
          {/* Submit Form */}
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
                  onChange={(e)