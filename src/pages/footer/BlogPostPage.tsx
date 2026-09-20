import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { Seo } from "@/components/Seo";
import { blogPosts, getBlogPost } from "@/content/blogPosts";

const SITE = "https://upcurvhub.upcurv.in";

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const url = `${SITE}/blog/${post.slug}`;
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={post.metaTitle}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
        image={`${SITE}${post.image}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription,
            image: [`${SITE}${post.image}`],
            datePublished: post.isoDate,
            dateModified: post.isoDate,
            author: { "@type": "Organization", name: post.author, url: SITE },
            publisher: {
              "@type": "Organization",
              name: "UpcurvHub",
              logo: { "@type": "ImageObject", url: `${SITE}/og-image.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            keywords: post.keywords.join(", "),
            articleSection: post.category,
            inLanguage: "en-IN",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link to="/blog" aria-label="Back to blog" className="text-muted-foreground hover:text-foreground transition-colors">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <span className="font-semibold text-foreground truncate">{post.category}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link> <span>/</span>{" "}
          <Link to="/blog" className="hover:text-foreground">Blog</Link> <span>/</span>{" "}
          <span className="text-foreground">{post.category}</span>
        </nav>

        <article>
          <Badge variant="outline" className="mb-3 text-xs">{post.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author}</span>
            <time dateTime={post.isoDate} className="flex items-center gap-1"><Calendar className="h-4 w-4" />{post.date}</time>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readTime}</span>
          </div>

          <img
            src={post.image}
            alt={post.imageAlt}
            width={1200}
            height={675}
            className="w-full rounded-2xl mb-8 object-cover"
          />

          <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>

          {post.sections.map((section) => (
            <section key={section.heading} className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="text-base text-muted-foreground leading-relaxed mb-3">{para}</p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              {post.faqs.map((faq) => (
                <Card key={faq.q} className="border border-border rounded-2xl">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {post.relatedModels && post.relatedModels.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">Models covered in this guide</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Open a model page for full specifications, variants, mileage, ownership costs and live used listings.
              </p>
              <div className="flex flex-wrap gap-2">
                {post.relatedModels.map((m) => (
                  <Link
                    key={m.path}
                    to={m.path}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
              <Link to="/models" className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline">
                Browse all car &amp; bike model pages
              </Link>
            </section>
          )}

          <Card className="rounded-2xl border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-primary-foreground mb-10">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">Ready to find your next vehicle?</h2>
              <p className="text-sm opacity-90 mb-4">
                Browse verified used cars and bikes from trusted dealers across Tamil Nadu and India.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/marketplace/vehicles" className="rounded-xl bg-background text-foreground px-4 py-2 text-sm font-semibold">
                  Browse vehicles
                </Link>
                <Link to="/sell-vehicle" className="rounded-xl border border-primary-foreground/40 px-4 py-2 text-sm font-semibold">
                  Sell your vehicle
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>

        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-lg font-bold text-foreground mb-4">Related guides</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="group">
                <Card className="h-full rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={p.image} alt={p.imageAlt} loading="lazy" width={1200} height={675} className="h-28 w-full object-cover" />
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-blue-600">{p.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default BlogPostPage;
