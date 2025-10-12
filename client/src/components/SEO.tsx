import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ReviewRating {
  ratingValue: number;
  bestRating: number;
  worstRating: number;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  preloadImage?: string;
  categories?: string[];
  tags?: string[];
  breadcrumbs?: BreadcrumbItem[];
  faq?: FAQItem[];
  reviewData?: {
    itemName: string;
    itemType: "FinancialService" | "Organization";
    rating?: ReviewRating;
    author?: string;
    datePublished?: string;
  };
}

export function SEO({
  title = "EntryLab - Forex Broker & Prop Firm News",
  description = "Stay informed with the latest forex broker news, prop firm updates, and trading analysis. Unbiased reviews and market insights for traders worldwide.",
  image = "https://entrylab.io/og-image.jpg",
  url = "https://entrylab.io",
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  preloadImage,
  categories,
  tags,
  breadcrumbs,
  faq,
  reviewData,
}: SEOProps) {
  
  // Organization Schema (always present)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EntryLab",
    "url": "https://entrylab.io",
    "logo": "https://entrylab.io/favicon.svg",
    "description": "Forex broker news, prop firm updates, and trading analysis platform",
    "sameAs": [
      "https://twitter.com/entrylab",
      "https://facebook.com/entrylab"
    ]
  };

  // Article Schema
  const articleSchema = type === "article" && publishedTime ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": {
      "@type": "Person",
      "name": author || "EntryLab Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "EntryLab",
      "logo": {
        "@type": "ImageObject",
        "url": "https://entrylab.io/favicon.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    ...(categories && categories.length > 0 && {
      "articleSection": categories.join(", ")
    }),
    ...(tags && tags.length > 0 && {
      "keywords": tags.join(", ")
    })
  } : null;

  // Review Schema
  const reviewSchema = reviewData ? {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": reviewData.itemType,
      "name": reviewData.itemName,
      "description": description
    },
    "author": {
      "@type": "Organization",
      "name": reviewData.author || "EntryLab"
    },
    "datePublished": reviewData.datePublished,
    ...(reviewData.rating && {
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": reviewData.rating.ratingValue,
        "bestRating": reviewData.rating.bestRating,
        "worstRating": reviewData.rating.worstRating
      }
    })
  } : null;

  // Breadcrumb Schema
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  } : null;

  // FAQ Schema
  const faqSchema = faq && faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  } : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      
      {/* Preload LCP image for faster rendering */}
      {preloadImage && (
        <link 
          rel="preload" 
          as="image" 
          href={preloadImage}
          fetchPriority="high"
        />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="EntryLab" />
      
      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {categories && categories.length > 0 && (
        <meta property="article:section" content={categories[0]} />
      )}
      {tags && tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      
      {reviewSchema && (
        <script type="application/ld+json">
          {JSON.stringify(reviewSchema)}
        </script>
      )}
      
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
    </Helmet>
  );
}
