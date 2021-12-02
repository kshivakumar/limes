function extractHost(url) {
  // TODO: Improve
  if (!url.startsWith("http")) url = "https://" + url
  try {
    let host = new URL(url).host
    if (host) return host
  } catch (error) {}
}

const getRules = chrome.declarativeNetRequest.getDynamicRules
const updateRules = chrome.declarativeNetRequest.updateDynamicRules
const storageApi = chrome.storage.sync

// class InvalidURLError extends Error {
//   constructor(url) {
//     super(`Invalid URL: ${url}`)
//   }
// }

function allowDomain(domain) {
  // remove the domain from rules - call updateRules({removeIds})
}

function denyDomain(domain) {
  // add the domain to the rules - call updateRules({addRules})
}

function generateRule(id, urlFilter) {
  return [
    {
      id,
      action: {
        type: "redirect",
        redirect: { extensionPath: "/redirect.html" },
      },
      condition: { urlFilter, resourceTypes: ["main_frame"] },
    },
  ]
}

export {
  extractHost,
  getRules,
  updateRules,
  generateRule,
  storageApi
}
