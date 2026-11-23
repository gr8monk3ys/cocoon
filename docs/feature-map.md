# Feature map

Every feature a user can reach, from the user's side. Other loops name
features by the **Feature** column; `pr-review` and `fuzz` walk it.

"Popup" is the toolbar button's panel; "Settings" is the options page
(popup → **Open full settings**, or `chrome://extensions` → Cocoon →
Extension options). Site rows were reached with the built extension (`dist/`)
loaded into Chromium and each site served from its `e2e/fixtures/<site>.html`
at the real URL, as `e2e/extension.spec.ts` does.

| Feature | Where | How to reach it | How to check it works |
|---|---|---|---|
| Feed hidden on X | x.com, twitter.com | Open the home page with Cocoon installed | The timeline is hidden and a banner reads "Cocoon: feed filtered on this site (limited)." |
| Feed hidden on Facebook | facebook.com | Open the home page | Feed posts, Stories, Reels and the right rail are hidden; same banner |
| Feed hidden on Instagram | instagram.com | Open the home page | Feed posts and suggested accounts are hidden; same banner |
| Feed hidden on YouTube | youtube.com | Open the home page | The home video grid is hidden; same banner |
| Feed hidden on Reddit | reddit.com | Open the home page | The feed is hidden; same banner |
| Feed hidden on TikTok | tiktok.com | Open the home page | The recommended feed is hidden; same banner |
| Opened post stays visible | instagram.com/p/… | Open a single post | The post is shown and no warning banner appears |
| Dismiss the feed banner | Banner at the top of a supported site | Click **Dismiss** | The banner disappears for the rest of that page |
| "Layout changed" warning | Banner on a supported site | Visit a supported site whose page has no feed Cocoon recognises | Banner reads "Cocoon: couldn't find this site's feed to filter — the page layout may have changed." |
| Feed intensity | Popup → Feed intensity; Settings → Feature toggles | Pick Full / Limited / None | None also hides Reels/Stories/Explore-style links (e.g. Instagram's Reels link); Full shows everything |
| Profile presets | Popup → Profile; Settings → Profile presets | Pick ADHD, Autism, Anxiety or Custom | The other controls switch to that profile's values (e.g. Anxiety turns dark mode on and the feed to Full) |
| Dark mode | Popup or Settings → Dark mode | Tick the box | The open site's colours invert (photos and video keep theirs) |
| Reduce motion | Popup or Settings → Reduce motion | Tick the box (on by default) | Animations and transitions stop on supported sites |
| Grounding overlay | Popup → **Open grounding tool** (needs "Enable grounding overlay") | On a supported site, open the popup and click the button | A "60-second reset" dialog with a counted breathing cue and the 5-4-3-2-1 list; **Continue browsing** closes it. With the box unticked the button is disabled |
| Scenario quick-switches | Popup or Settings → Scenario quick-switches | Pick a length (15/30/60 min), click Focus session, Low stimulation, Calm reset or Social guardrails | Settings change at once (Focus session: feed None, reduce motion on) and an expiry timer is armed for the chosen length, after which your baseline comes back |
| This-site on/off | Popup → Current site override | On a supported site, untick "Enable feed cleaner on this site" | The feed reappears on that site only; **Reset to global default** hides it again |
| Per-site overrides list | Settings → Per-site feed cleaner overrides | Type a supported domain, set Enable, **Save** | The site appears in the list ("reddit.com: Disabled") and that site's feed is no longer hidden; **Remove** takes it off the list |
| Adaptive suggestions by site | Settings → Adaptive profile engine → Domain rules | Tick "Enable adaptive suggestions", save a hostname and a profile, then open the popup on that site | The popup shows "Suggested profile for this context" and **Apply suggestion** switches to it. The hostname must match the tab's exactly (`www.instagram.com`, not `instagram.com`) |
| Adaptive suggestions by time | Settings → Adaptive profile engine → Schedule rules | Enter a start and end hour and a profile, **Add** | The rule is listed ("9:00-10:00 → anxiety"); during those hours the popup shows "Suggested profile for this context: anxiety". **Remove** deletes it |
| Open full settings | Popup → **Open full settings** | Click it | The "Cocoon Settings" page opens in a tab |
