## Description
User can select a site and set the frequency/schedule at which he's allowed to view that site

## Storage schema
```json
{
  "configs": [
    {
      "host": "abc.com",
      "config": {
        "mon": {
          "schedule": ["09:00", "10:00"],
          "frequency": 99999
        },
        "tue": {
          "schedule": ["00:00", "23:59"],
          "frequency": 1
        },
      }
    },
    {
      "host": "example.com",
      "config": {
        "sat": {
          "schedule": ["15:00", "15:30"],
          "frequency": 99999
        }
      }
    }
  ],
  "currentDayVisits": {
    "abc.com": 0,
    "example.com": 3
  }
}
```
1. This is probably a better data model because the data is at more granular level. This should allow adding more complex time control in future with minimal or no schema changes.
2. The config shows the times and frequency during which the site is **allowed** to visit. Rest of the times it should be blocked.
3. Both `schedule` and `frequency` fields must be present in config.
4. Absence of a weekday under `config` means the website is totally blocked for that day.
5. Schedule of ["00:00", "23:59"] means all day. TBD: Should I make it "24:00"?
6. Chrome's API doesn't support saving `Infinity` in storage, using 99999 as an alternative. `frequency = 99999` means any number of times. 
7. If `schedule = ["00:00", "23:59"]` and `frequency = `99999`, the site is allowed w/o any restrictions for whole day.
8. Future improvement: add "weekConfig". The current `config` can actually be termed `dayConfig` because the time control is at weekday level. `dayConfig` doesn't properly handle use cases such as,
"Limit the website to two times a week". User can either select two weekdays with freq = 1 for each or a single day with freq = 2 and that's more like a workaround since it's not equivalent to "Two times during any time of the week". To handle such use cases, we can add `weekConfig` that will have config at week level.
9. `currentDayVisits` is used to track site visit counts. Only the hosts whose frequency != 99999 are tracked in this field.  
   `webNavigation` api is used to detect the site visit events. This is the most efficient way for this extension - https://stackoverflow.com/a/70462019

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
          The above still adds the page to chrome history, afterall, it _is_ redirection.
          
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
    
    3. Remove the extension's redirected page from history immediately.  
       This requires "history" permission and since the actual functionality doesn't need that permission, it's probably overkill.
  
   For now, I will simply block the website without any custom error page or alerts. (I am probably overthinking)


## Untested scenarios
1. hosts with non-ascii chars
2. timezones with daylight savings
