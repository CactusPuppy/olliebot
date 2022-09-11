// #region workshop.codes
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
// #endregion

// #region overwatcharcade.today
export interface owtAPIResponse<D = unknown> {
  data: D,
  success: boolean,
  errorMessages: string[],
  statusCode: number
}

export interface owtMode {
  name: string,
  players: string,
  description: string,
  /** URL */
  image: string,
  /** Usually "Daily" or null */
  label: string
}

export interface owtOverwatchTodayData {
  isToday: boolean,
  modes: owtMode[],
  /** e.g. 2022-09-11T00:00:18.8106243 */
  createdAt: string,
  contributor: unknown // TODO: fill later if needed
}
// #endregion
