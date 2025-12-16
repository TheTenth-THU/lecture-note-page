"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ForwardIcon } from "@heroicons/react/24/outline";

/**
 * Types for GitHub API responses
 * GitHub API 响应的类型定义
 */
interface GitHubDirectoryDetailTerm {
  // represents a file or directory
  name: string;
  type: string;
  path: string;
  children?: GitHubDirectoryDetailTerm[];
}
interface DocResponse {
  type: "DIR" | "FILE";
  details?: GitHubDirectoryDetailTerm[];
  title?: string;
  url?: string;
} // Home page only uses DIR responses.

export default function DocPage() {
  const semesters = useMemo(
    () => ["23Autumn", "24Spring", "24Autumn", "25Spring", "25Autumn"],
    [],
  );

  const [coursesBySemester, setCoursesBySemester] = useState<
    Record<string, GitHubDirectoryDetailTerm[]>
  >({}); // e.g., { "23Autumn": [course1, course2, ...], ... }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    /**
     * 获取所有学期的课程目录，加载到 coursesBySemester 状态中
     * @returns Promise<void>
     */
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          semesters.map(async (semester) => {
            const res = await fetch(
              `/api/get-doc?semester=${encodeURIComponent(semester)}&page=/`,
            );
            if (!res.ok) {
              console.error(
                `${semester} 获取失败：${res.status} ${res.statusText}`,
              );
              return [semester, [] as GitHubDirectoryDetailTerm[]] as const;
            }
            const data: DocResponse = await res.json();

            if (data.type !== "DIR" || !Array.isArray(data.details)) {
              console.error(`${semester} 返回结果不是目录`);
              return [semester, [] as GitHubDirectoryDetailTerm[]] as const;
            }
            const courses = (data.details || []).filter(
              (item) => item.type === "dir" && !item.name.startsWith("."),
            );

            return [semester, courses] as const;
          }),
        );

        if (cancelled) return;

        const map: Record<string, GitHubDirectoryDetailTerm[]> = {};
        for (const [semester, courses] of results) {
          if (!semester || courses.length === 0) continue;
          map[semester] = courses;
        }
        setCoursesBySemester(map);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "首页加载失败");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [semesters]);

  return (
    <div className="mx-auto mt-10 min-h-screen max-w-5xl px-8 md:px-20">
      {error ?
        <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-semibold">Error Message</p>
          {error}
        </div>
      : null}

      {isLoading ?
        <div className="text-gray-500 dark:text-gray-400">
          正在加载课程列表…
        </div>
      : <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...semesters].reverse().map((semester) => {
            const courses = coursesBySemester[semester];
            if (!courses) return null;
            return (
              <div
                key={semester}
                className="rounded-xl bg-linear-150 from-[#41044a44] from-60% to-[#a8054c22]">
                <div className="mb-3 flex items-baseline justify-between rounded-t-xl bg-[#f3e8ff] px-5 pt-4 pb-3 dark:bg-[#41044a]">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {semester}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {courses.length} Lecture{courses.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <ul className="space-y-1 px-4 pb-4">
                  {courses.map((course) => (
                    <li key={`${semester}/${course.name}`}>
                      <Link
                        href={`/${encodeURIComponent(semester)}/${encodeURIComponent(course.name)}`}
                        className="py-0.1 block truncate rounded-md px-2 text-[16px] text-[#41044a] hover:bg-purple-50 dark:text-white dark:hover:bg-[#41044a]">
                        <ForwardIcon className="mr-2 inline h-4 w-4 align-middle" />
                        {course.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      }
    </div>
  );
}
