import { ArticleCard } from '../ArticleCard';

export default function ArticleCardExample() {
  return (
    <div className="max-w-sm">
      <ArticleCard
        title="Understanding Forex Leverage: A Comprehensive Guide"
        excerpt="Learn how leverage works in forex trading and how to use it responsibly to maximize your trading potential."
        author="Sarah Johnson"
        date="2025-10-05"
        category="Education"
        link="https://example.com/article"
      />
    </div>
  );
}
