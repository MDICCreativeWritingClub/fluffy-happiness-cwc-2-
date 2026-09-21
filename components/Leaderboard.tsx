"use client";

import { colors } from "@/lib/theme";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AuthorLink } from "@/components/AuthorLink";
import { Trophy, ThumbsUp, ChevronDown, BookOpen, Calendar, Crown } from "lucide-react";
import { articles } from "@/data/articles";
import { useVotes } from "@/context/VoteContext";
import { usePublishedArticles } from "@/hooks/usePublishedArticles";

type LeaderboardTab = "alltime" | "writers-month" | "writings-month";

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("alltime");
  const [expandedWriter, setExpandedWriter] = useState<string | null>(null);
  const { votes } = useVotes();
  const { allPublished } = usePublishedArticles();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // All-time writers ranking
  const allTimeWriters = useMemo(() => {
    const writersMap = new Map<string, { totalVotes: number; articles: typeof allPublished; grade: string }>();
    allPublished.forEach((article) => {
      const existing = writersMap.get(article.author);
      if (existing) {
        existing.articles.push(article);
        existing.totalVotes += votes[article.id] ?? article.votes;
      } else {
        writersMap.set(article.author, {
          articles: [article],
          totalVotes: votes[article.id] ?? article.votes,
          grade: article.grade,
        });
      }
    });
    return Array.from(writersMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalVotes - a.totalVotes);
  }, [allPublished, votes]);

  // This month's writers ranking
  const monthlyWriters = useMemo(() => {
    const monthlyArticles = allPublished.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const writersMap = new Map<string, { totalVotes: number; articles: typeof monthlyArticles; grade: string }>();
    monthlyArticles.forEach((article) => {
      const existing = writersMap.get(article.author);
      if (existing) {
        existing.articles.push(article);
        existing.totalVotes += votes[article.id] ?? article.votes;
      } else {
        writersMap.set(article.author, {
          articles: [article],
          totalVotes: votes[article.id] ?? article.votes,
          grade: article.grade,
        });
      }
    });
    return Array.from(writersMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalVotes - a.totalVotes);
  }, [allPublished, votes, currentMonth, currentYear]);

  // This month's writings ranking
  const monthlyWritings = useMemo(() => {
    return allPublished
      .filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map((a) => ({ ...a, currentVotes: votes[a.id] ?? a.votes }))
      .sort((a, b) => b.currentVotes - a.currentVotes);
  }, [allPublished, votes, currentMonth, currentYear]);

  const tabs: { key: LeaderboardTab; label: string; icon: React.ReactNode }[] = [
    { key: "alltime", label: "Top Writers of All Time", icon: <Trophy size={14} /> },
    { key: "writers-month", label: "Writers This Month", icon: <Crown size={14} /> },
    { key: "writings-month", label: "Writings This Month", icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.green200, backgroundColor: colors.surface }}>
      <div className="px-5 py-3.5" style={{ backgroundColor: colors.green900 }}>
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: colors.yellow400 }} />
          <span style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "0.95rem" }}>Leaderboard</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b" style={{ borderColor: colors.gray200 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setExpandedWriter(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all flex-1 justify-center active:scale-95"
            style={{
              backgroundColor: activeTab === tab.key ? colors.green900 : colors.gray100,
              color: activeTab === tab.key ? colors.white : colors.gray700,
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.key === "alltime" ? "All Time" : tab.key === "writers-month" ? "Writers" : "Writings"}</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* All Time Writers */}
        {activeTab === "alltime" && (
          <div className="flex flex-col gap-2">
            {allTimeWriters.length === 0 ? (
              <p style={{ color: colors.gray400, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>No writers yet</p>
            ) : (
              allTimeWriters.slice(0, 10).map((writer, i) => (
                <div key={writer.name} className="rounded-lg overflow-hidden transition-all hover:shadow-sm" style={{ border: `1px solid ${colors.gray200}` }}>
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all hover:pl-4"
                    onClick={() => setExpandedWriter(expandedWriter === writer.name ? null : writer.name)}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: i === 0 ? colors.yellow100 : i === 1 ? colors.gray100 : i === 2 ? colors.red50 : colors.gray50,
                        color: i === 0 ? colors.amber600 : i === 1 ? colors.gray500 : i === 2 ? colors.red600 : colors.gray400,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate"><AuthorLink name={writer.name} studentCode={writer.articles[0]?.studentCode} /></p>
                      <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>{writer.grade} · {writer.articles.length} writings</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ThumbsUp size={12} style={{ color: colors.green600 }} />
                      <span style={{ color: colors.badgeText, fontSize: "0.85rem", fontWeight: 600 }}>{writer.totalVotes}</span>
                    </div>
                    <ChevronDown size={14} style={{ transform: expandedWriter === writer.name ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }} />
                  </div>
                  {expandedWriter === writer.name && (
                    <div className="border-t bg-gray-50 dark:bg-[var(--token-gray50)] p-3 animate-in fade-in slide-in-from-top-1 duration-200" style={{ borderColor: colors.gray200 }}>
                      {writer.articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.id}`}
                          className="flex items-center justify-between py-2 hover:bg-white dark:bg-[var(--token-white)] rounded px-2 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p style={{ color: colors.heading, fontSize: "0.8rem" }} className="truncate">{article.title}</p>
                            <p style={{ color: colors.gray400, fontSize: "0.65rem" }}>{article.category}</p>
                          </div>
                          <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }}>
                            {votes[article.id] ?? article.votes}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Monthly Writers */}
        {activeTab === "writers-month" && (
          <div className="flex flex-col gap-2">
            {monthlyWriters.length === 0 ? (
              <p style={{ color: colors.gray400, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>No writers this month yet</p>
            ) : (
              monthlyWriters.slice(0, 10).map((writer, i) => (
                <div key={writer.name} className="rounded-lg overflow-hidden transition-all hover:shadow-sm" style={{ border: `1px solid ${colors.gray200}` }}>
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all hover:pl-4"
                    onClick={() => setExpandedWriter(expandedWriter === `month-${writer.name}` ? null : `month-${writer.name}`)}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: i === 0 ? colors.yellow100 : i === 1 ? colors.gray100 : i === 2 ? colors.red50 : colors.gray50,
                        color: i === 0 ? colors.amber600 : i === 1 ? colors.gray500 : i === 2 ? colors.red600 : colors.gray400,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate"><AuthorLink name={writer.name} studentCode={writer.articles[0]?.studentCode} /></p>
                      <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>{writer.grade} · {writer.articles.length} writings this month</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ThumbsUp size={12} style={{ color: colors.green600 }} />
                      <span style={{ color: colors.badgeText, fontSize: "0.85rem", fontWeight: 600 }}>{writer.totalVotes}</span>
                    </div>
                    <ChevronDown size={14} style={{ transform: expandedWriter === `month-${writer.name}` ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }} />
                  </div>
                  {expandedWriter === `month-${writer.name}` && (
                    <div className="border-t bg-gray-50 dark:bg-[var(--token-gray50)] p-3 animate-in fade-in slide-in-from-top-1 duration-200" style={{ borderColor: colors.gray200 }}>
                      {writer.articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.id}`}
                          className="flex items-center justify-between py-2 hover:bg-white dark:bg-[var(--token-white)] rounded px-2 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p style={{ color: colors.heading, fontSize: "0.8rem" }} className="truncate">{article.title}</p>
                            <p style={{ color: colors.gray400, fontSize: "0.65rem" }}>{article.category}</p>
                          </div>
                          <span style={{ color: colors.green600, fontWeight: 600, fontSize: "0.8rem" }}>
                            {votes[article.id] ?? article.votes}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Monthly Writings */}
        {activeTab === "writings-month" && (
          <div className="flex flex-col gap-2">
            {monthlyWritings.length === 0 ? (
              <p style={{ color: colors.gray400, fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>No writings this month yet</p>
            ) : (
              monthlyWritings.slice(0, 10).map((writing, i) => (
                <Link
                  key={writing.id}
                  href={`/article/${writing.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ border: `1px solid ${colors.gray200}` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: i === 0 ? colors.yellow100 : i === 1 ? colors.gray100 : i === 2 ? colors.red50 : colors.gray50,
                      color: i === 0 ? colors.amber600 : i === 1 ? colors.gray500 : i === 2 ? colors.red600 : colors.gray400,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: colors.heading, fontWeight: 500, fontSize: "0.85rem" }} className="truncate">{writing.title}</p>
                    <p style={{ color: colors.gray400, fontSize: "0.7rem" }}>
                      <AuthorLink name={writing.author} studentCode={writing.studentCode} /> · {writing.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ThumbsUp size={12} style={{ color: colors.green600 }} />
                    <span style={{ color: colors.badgeText, fontSize: "0.85rem", fontWeight: 600 }}>{writing.currentVotes}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
