export type EditorialPostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'rejected' | 'unpublished' | 'archived';
export type EditorialPostType = 'news' | 'article' | 'interview' | 'profile' | 'chronicle' | 'review' | 'guide' | 'agenda' | 'featured_project' | 'featured_space' | 'featured_artist' | 'call' | 'opinion' | 'sponsored' | 'other';
export type EditorialBodyBlock =
  | { id: string; type: 'paragraph' | 'subtitle' | 'quote'; text: string }
  | { id: string; type: 'image'; url: string; alt: string; caption?: string }
  | { id: string; type: 'list'; items: string[] }
  | { id: string; type: 'link' | 'cta' | 'video'; label: string; url: string };

export interface EditorialPost {
  id: string; slug: string; postType: EditorialPostType; title: string; excerpt: string;
  bodyBlocks: EditorialBodyBlock[]; coverImageUrl: string; coverImageAlt: string;
  coverCaption: string; credits: string; byline: string; category: string; tags: string[];
  location: string; relatedProjectId: string | null; status: EditorialPostStatus;
  seoTitle: string; seoDescription: string; shareTitle: string; shareDescription: string;
  shareImageUrl: string; isSponsored: boolean; sponsorLabel: string; sponsorshipDisclosure: string;
  publishAt: string; publishedAt: string | null; createdAt: string; updatedAt: string;
}

export type HomepageBlockType = 'hero' | 'featured_articles' | 'latest_posts' | 'featured_project' | 'featured_actor' | 'agenda' | 'gallery' | 'editorial_text' | 'quote' | 'video' | 'banner' | 'calls' | 'newsletter' | 'sponsored_feature';
export interface HomepageSection {
  id: string; logicalId: string; blockType: HomepageBlockType; title: string; subtitle: string; description: string;
  ctaLabel: string; ctaUrl: string; imageUrl: string; relatedPostId: string | null;
  relatedProjectId: string | null; variant: 'default' | 'compact' | 'feature' | 'grid' | 'full_bleed';
  position: number; isVisible: boolean; versionStatus: 'draft' | 'published';
}

export interface EditorialMediaAsset {
  id: string; publicUrl: string; storagePath: string; fileName: string; mimeType: string;
  sizeBytes: number; altText: string; credit: string; description: string; createdAt: string;
}
