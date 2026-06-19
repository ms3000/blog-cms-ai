import type { PostCardData } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

export function PostGrid({ posts }: { posts: PostCardData[] }) {
  if (posts.length === 0) {
    return <p className="py-20 text-center text-ink-muted">아직 글이 없습니다.</p>;
  }
  return (
    <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <PostCard key={p.slug} post={p} priority={i < 3} />
      ))}
    </div>
  );
}
