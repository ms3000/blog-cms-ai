import Link from "next/link";
import type { PostCardData } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function PostCard({ post, priority = false }: { post: PostCardData; priority?: boolean }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-line">
          {post.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_url}
              alt={post.cover_alt || post.title}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-faint">
              {post.title.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="mt-4">
          {post.category && (
            <span className="text-xs font-bold tracking-wide text-accent">
              {post.category}
            </span>
          )}
          <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-ink line-clamp-2 group-hover:text-accent">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted line-clamp-2">
              {post.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
            <span>{post.author || "WEDO"}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            <span aria-hidden>·</span>
            <span>{post.reading_minutes}분</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
