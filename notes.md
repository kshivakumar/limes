## Description
User can select a site and set the frequency at which he's allowed to view that site

## Storage schema
```json
{
  "hosts": ["example.com", "foo.bar.com"],
  "hostConfigs": [
      {"host": "example.com", "frequency": "day | week | weekend", "count": 3},
      {"host": "foo.bar.com", "frequency": "day | week | weekend", "count": 1}
    ]
  }
}
```
## Compatability
1. Service worker file must be in the root path where manifest.json is - before Chrome 93
2. ES imports in background.js - since Chrome 92

## Known Issues/Inconveniences
1. Due to redirection of denied websites to redirect.html, several places in Chrome show the title and icon of redirect.html instead of the actual website. These places are history and new tab most visited sites, there could be more.  

   Possible Fixes:
   1. Just block the website instead of redirection: change rule type from 'redirect' to 'block'.  
      This is the most straight-forward way, doesn't need any additional changes.  
      
      But it would be nice if Chrome's error page is customizable so that we can show why the page is blocked and when it would be unblocked. There are two ways:
    
       - Approach 1 - show a custom page
          ```js
          chrome.webNavigation.onErrorOccurred.addListener(details => {
            if (
              details.error === "net::ERR_BLOCKED_BY_CLIENT" &&
              details.url.includes("ycombinator.com")
            ) {
              chrome.scripting.executeScript({
                target: { tabId: details.tabId },
                files: ["alert.js"],
              })
            }
          })
          ```
          The above still adds the page to chrome history.
          
       - Approach 2 - show alert on the error page
          ```js
          chrome.webNavigation.onErrorOccurred.addListener(details =>
            // skipping if statement
            chrome.scripting.executeScript({
              target: { tabId: details.tabId },
              files: ["alert.js"],
            })
          )

          // alert.js
          alert('This website is blocked temporarily');
          ```
          Chrome's error page - `chrome-error://` doesn't allow code injection

    2. Save the actual website's title and icon and use them in the redirected page dynamically.
    
       The history will still show the extension's url and the not the actual website's.
       
       This seems lot of work.
  
   For now, I will simply block the website without any custom error page or alerts.

## Known Bugs
