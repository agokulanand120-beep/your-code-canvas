import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { Seo } from "@/components/Seo";
import { blogPosts } from "@/content/blogPosts";

const SITE = "https://upcurvhub.upcurv.in";

const BlogPage = () => {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Used Car & Bike Buying Guides | UpcurvHub Blog"
        description="Practical guides on buying and selling pre-owned cars and bikes in India — pricing, inspection checklists, loans, insurance and RTO transfer."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "UpcurvHub Blog",
          url: `${SITE}/blog`,
          blogPost: blogPosts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `${SITE}/blog/${p.slug}`,
            datePublished: p.isoDate,
            image: `${SITE}${p.image}`,
            author: { "@type": "Organization", name: p.author },
          })),
        }}
      />

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link to="/" aria-label="Back to home" className="text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <div>
              <h1 className="font-bold text-lg text-foreground">Blog & Guides</h1>
              <p className="text-xs text-muted-foreground">Expert advice for buying &amp; selling vehicles</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link to={`/blog/${featured.slug}`} className="block mb-8 group">
          <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
            <div className="grid md:grid-cols-2">
              <img
                src={featured.image}
                alt={featured.imageAlt}
                width={1200}
                height={675}
                className="h-56 md:h-full w-full object-cover"
              />
              <CardContent className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Badge className="bg-white/20 text-white border-0 mb-4">{featured.category}</Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline">{featured.title}</h2>
                <p className="text-blue-100 mb-4">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-blue-200">
                  <time dateTime={featured.isoDate} className="flex items-center gap-1"><Calendar className="h-4 w-4" />{featured.date}</time>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featured.readTime}</span>
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
              <Card className="h-full overflow-hidden border border-border hover:shadow-lg transition-shadow rounded-2xl">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  loading="lazy"
                  width={1200}
                  height={675}
                  className="h-40 w-full object-cover group-hover:scale-[1.02] transition-transform"
                />
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-3 text-xs">{post.category}</Badge>
                  <h2 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <time dateTime={post.isoDate} className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</time>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default BlogPage;
