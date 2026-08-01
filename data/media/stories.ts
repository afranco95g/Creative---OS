export type StoryType =
  | 'documentary'
  | 'interview'
  | 'article'
  | 'opinion'
  | 'photo-story'
  | 'report';

export interface Story {
  id: string;
  slug: string;

  type: StoryType;

  title: string;

  excerpt: string;

  author: string;

  cover: string;

  publishedAt: string;

  readingTime: number;

  featured: boolean;

  tags: string[];
}

export const stories: Story[] = [
  {
    id: '1',

    slug: 'san-felipe',

    type: 'documentary',

    title:
      'San Felipe: el barrio donde los talleres volvieron a abrir',

    excerpt:
      'Un recorrido por artistas, talleres y espacios independientes que están redefiniendo uno de los distritos creativos más importantes de Bogotá.',

    author: 'Cultura Está',

    cover: '/images/san-felipe.jpg',

    publishedAt: '2026-07-18',

    readingTime: 12,

    featured: true,

    tags: ['Bogotá', 'Arte', 'Documental'],
  },
];