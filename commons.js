function sanitizeUrl(url) {
  if (!url.startsWith('http')) url = 'https://' + url
  let host = (new URL(url)).host
  if (host) return host
}

const getRules = chrome.declarativeNetRequest.getDynamicRules
const updateRules = chrome.declarativeNetRequest.updateDynamicRules
const storageApi = chrome.storage.sync

// class InvalidURLError extends Error {
//   constructor(url) {
//     super(`Invalid URL: ${url}`)
//   }
// }

export { sanitizeUrl, getRules, updateRules, storageApi }
