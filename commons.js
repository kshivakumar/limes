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

function undenyDomain(domain) {
  // remove the domain from rules - call updateRules({removeIds})
  
}

function denyDomain(domain) {
  pass
}

async function getCurrentDeniedDomains() {
  let rules = await getRules()
  let domains = findDomainsFromRules(rules)
  return domains
}

function findDomainsFromRules(rules) {
  let domains = rules.map(rule => {
    rule.urlFilter
  })
  return [...new Set(domains)]
}

function generateUrlFiltersFromDomain(domain) {
  // Use regexFilter. Re-learn regex(for the upteenth time)
  let variations = ['https://', 'http://', 'www.', 'https://www.', 'http://www.']
  return variations.map(v => v + domain + '*')
}

function generateRule(id, urlFilter) {
  // TODO: Replace urlFilter with regexFilter
  return [
    {
      id,
      action: {
        type: "block",
        // redirect: { extensionPath: "/redirect.html" },
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
