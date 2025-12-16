import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface GitHubFileResponse {
  type: string;
  name: string;
  content: string;
  encoding: BufferEncoding;
}

function guessContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  // 从环境变量中获取 GitHub 仓库信息
  const { env } = getCloudflareContext();
  const GITHUB_TOKEN = await env.GITHUB_NOTE_TOKEN.get();

  const { searchParams } = new URL(request.url);
  const semester = searchParams.get("semester");
  if (!semester) {
    return NextResponse.json(
      { error: "Semester path `semester` is required" },
      { status: 400 },
    );
  }
  const page = searchParams.get("page");
  if (!page) {
    return NextResponse.json(
      { error: "Page path `page` is required" },
      { status: 400 },
    );
  }

  const REPO_OWNER = "TheTenth-THU";
  const REPO_NAME = `THUEE23-${semester}`;

  const fileUrl =
    page.startsWith("/") ?
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents${page}`
    : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${page}`;

  const res = await fetch(fileUrl, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "THUEE23-NotesOnWebsite",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to fetch asset ${fileUrl}:`, errorText);
    return NextResponse.json(
      { error: "File not found or failed to fetch" },
      { status: res.status },
    );
  }

  const data = (await res.json()) as GitHubFileResponse | unknown;

  // 目录不支持作为 asset 返回
  if (Array.isArray(data) || (data as any)?.type !== "file") {
    return NextResponse.json(
      { error: "Only file is supported for /api/get-asset" },
      { status: 400 },
    );
  }

  const file = data as GitHubFileResponse;

  // GitHub Contents API 的 file.content 是 base64
  const buffer = Buffer.from(file.content, file.encoding || "base64");
  const contentType = guessContentType(file.name);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // 让浏览器/边缘缓存一小时（与你的 fetch revalidate 对齐）
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
