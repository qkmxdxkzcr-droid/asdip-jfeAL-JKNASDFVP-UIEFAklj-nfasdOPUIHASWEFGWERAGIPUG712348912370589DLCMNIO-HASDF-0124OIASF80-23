export function createPageUrl(pageName) {
  const baseUrl = process.env.NODE_ENV === 'production' ? '/skobki-planner' : '';
  return `${baseUrl}/${pageName.toLowerCase()}`;
}
