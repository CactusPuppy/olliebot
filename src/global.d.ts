export interface wscPost {
  code: string,
  nice_url?: string,
  title: string,
  thumbnail: string,
  categories: string[],
  maps: string[],
  heroes: string[],
  tags?: string,
  created_at: string,
  updated_at: string,
  last_revision_created_at: string,
  user: {
    username: string,
    nice_url?: string,
    verified: boolean
  }
}

export interface wscWikiArticle {
  id: number,
  title: string,
  subtitle?: string,
  content: string
  slug: string,
  tags: string,
  category: {
    title: string
  }
  created_at: string,
  updated_at: string
}
