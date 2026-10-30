import "@/app/blog/blog.css";
import { PostList } from "@/components/admin/blog/PostList";
import { getPostViews } from "@/lib/admin/analytics";
import { listPosts } from "@/lib/admin/data";

export default async function BlogAdminPage() {
  const [posts, views] = await Promise.all([
    listPosts(),
    // Sem analytics (ou com o Umami fora do ar) a lista continua funcionando
    getPostViews().catch(() => null),
  ]);
  return <PostList posts={posts} views={views} />;
}
