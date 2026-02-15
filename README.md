# Smart Bookmark App

A modern bookmark manager built with Next.js, Supabase, and custom CSS.

## Features
- ✅ Google OAuth authentication
- ✅ Add bookmarks with title and URL
- ✅ Private bookmarks per user (RLS policies)
- ✅ Real-time updates across tabs
- ✅ Delete bookmarks
- ✅ Modern, responsive UI with animations

## 🛠️ Problems Faced & Solutions

### 1. Duplicate Key Error (409 Conflict)
**Problem:** Getting "duplicate key violates unique constraint" when adding bookmarks
**Solution:** Realized UUID wasn't auto-generating. Fixed by ensuring database uses `gen_random_uuid()` as default for id column.

### 2. RLS Policy Issues
**Problem:** Users could see all bookmarks or none at all
**Solution:** Implemented proper policies with `auth.uid() = user_id` for SELECT, INSERT, and DELETE operations.

### 3. Real-time Updates Not Working
**Problem:** Bookmarks wouldn't update across different browser tabs
**Solution:** Added Supabase real-time subscription with proper channel configuration and cleanup in useEffect.

### 4. URL Formatting Errors
**Problem:** Bookmarks without https:// wouldn't open correctly
**Solution:** Added automatic https:// prefix if no protocol specified.

### 5. Vercel Deployment Failures
**Problem:** Build failing with "supabaseUrl is required"
**Solution:** Added environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel dashboard.

### 6. 400 Bad Request Error
**Problem:** `column bookmarks.created_at does not exist`
**Solution:** Added created_at column to database or removed order by clause.

## 🚀 Live Demo
[https://smart-bookmark-app1-cyan.vercel.app](https://smart-bookmark-app1-cyan.vercel.app)

## 💻 Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth, Database, Realtime)
- Custom CSS with modern design
- Deployed on Vercel

## 📦 Local Setup

```bash
# Clone repository
git clone https://github.com/abinaya242004/smart-bookmark-app.git

# Navigate to project
cd smart-bookmark-app

# Install dependencies
npm install

# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev



## 📁 Database Schema

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" 
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" 
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
