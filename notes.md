## Description
User can select a site and set the frequency at which he's allowed to view that site

## Storage schema
```json
{
  "urls": {
    "example.com": {
    "ruleId": 1,
    "frequency": "daily",
    "count": 3
    }
  }
}
```
## Compatability
1. Before Chrome 93, the service worker file must be in the root path where manifest.json is.
This is a limitation of Service Worker specification, relaxed for extensions since Chrome 93.
2. ES imports in background.js - since Chrome 92