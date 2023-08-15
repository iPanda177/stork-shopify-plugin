export interface shopifySession {
  id: string,
  shop: string,
  state: string,
  isOnline: boolean,
  scope: string,
  accessToken: string
}

export interface Webhook {
  id: number,
  address: string,
  topic: string,
  created_at: string,
  updated_at: string,
  format: string,
  fields: any[],
  metafield_namespaces: any[],
  api_version: string,
  private_metafield_namespaces: any[]
}

export interface Webhooks {
  data: Webhook[],
}