export function createPageUrl(pageName) {
  const baseUrl = process.env.NODE_ENV === 'production' ? '/some-bulshit-bracker-scheduler' : '';
  return `${baseUrl}/${pageName.toLowerCase()}`;
}
