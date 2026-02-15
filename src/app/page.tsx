"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🔹 Fetch bookmarks for current user
  const fetchBookmarks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBookmarks([]);
      return;
    }

    setUser(user);

    const { data: bookmarksData, error: fetchError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Fetch error:", fetchError.message);
    } else {
      setBookmarks(bookmarksData || []);
    }
  };

  // 🔹 Add a new bookmark
  const addBookmark = async () => {
    if (!title || !url) {
      alert("Please enter both title and URL");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not logged in");
        return;
      }

      // Format URL properly
      let formattedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        formattedUrl = "https://" + url;
      }

      // Check for duplicate URLs (optional)
      if (bookmarks.some((b) => b.url === formattedUrl)) {
        alert("This bookmark already exists");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("bookmarks")
        .insert([
          {
            title,
            url: formattedUrl,
            user_id: user.id,
          },
        ])
        .select(); // Add select() to get the inserted data

      if (insertError) {
        console.error("Insert error:", insertError);

        // Handle specific error codes
        if (insertError.code === "23505") {
          alert("This bookmark already exists (duplicate entry)");
        } else if (insertError.code === "42501") {
          alert("Permission denied. Please check RLS policies.");
        } else if (insertError.code === "23503") {
          alert("Foreign key violation. User ID might be invalid.");
        } else {
          alert(`Error: ${insertError.message}`);
        }
        return;
      }

      console.log("Bookmark added successfully:", data);

      // Clear form
      setTitle("");
      setUrl("");

      // Refresh list
      fetchBookmarks();
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete a bookmark
  const deleteBookmark = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }

    try {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete bookmark");
        return;
      }

      // Update local state immediately
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred");
    }
  };

  // 🔹 Set up real-time subscription
  useEffect(() => {
    fetchBookmarks();

    // Set up real-time subscription
    const channel = supabase
      .channel("bookmarks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Real-time update:", payload);

          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b)),
            );
          }
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 🔹 Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
  };

  // Update the className in your return statement:

  return (
    <div className="container">
      {/* Header */}
      {/* Header */}
      <div className="header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <h1>My Bookmarks</h1>
          {user && (
            <button onClick={signOut} className="sign-out-btn">
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Add Bookmark Form */}
      {user && (
        <div className="form-container">
          <h2 className="form-title">Add New Bookmark</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="url"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          </div>
          <button onClick={addBookmark} disabled={loading} className="add-btn">
            {loading ? "Adding..." : "Add Bookmark"}
          </button>
        </div>
      )}

      {/* Bookmarks List */}
      {user ? (
        <div className="bookmarks-container">
          <div className="bookmarks-header">
            <h2>Your Bookmarks</h2>
          </div>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <svg
                className="empty-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M5 5h14v14H5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9h6v6H9z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 3h18v18H3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>No bookmarks yet. Add your first bookmark above!</p>
            </div>
          ) : (
            <div>
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bookmark-card">
                  <div className="bookmark-info">
                    <h3 className="bookmark-title">{bookmark.title}</h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-url"
                    >
                      {bookmark.url}
                    </a>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="signin-container">
          <h2 className="signin-title">Welcome to Smart Bookmarks</h2>
          <p className="signin-text">
            Sign in to save and manage your favorite links
          </p>
          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({ provider: "google" })
            }
            className="google-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
