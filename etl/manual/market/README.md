# Gaijin Market snapshots

The Market's API needs a logged-in token, so prices come from a browser export instead of the daily build.
Each `YYYY-MM-DD.json` here is one snapshot; the build uses the newest for prices and all of them for price
history (the market page's "price drops" compares the newest two).

## Taking a snapshot

1. Log in at https://trade.gaijin.net in Chrome.
2. Open DevTools (F12) → Console, paste the script below and press Enter. It reads your own session's token
   from the page, lists War Thunder items with the same request the market page uses, and downloads
   `wt-market.json`. Nothing is sent anywhere else.
3. Save the file here as `etl/manual/market/<today>.json` and commit it.

```js
(async () => {
  let token = null;
  for (let i = 0; i < localStorage.length && !token; i++) {
    const raw = localStorage.getItem(localStorage.key(i));
    try {
      const v = JSON.parse(raw);
      token = v?.auth?.tokenPair?.token || v?.tokenPair?.token || v?.token || null;
    } catch {}
    if (!token && raw && raw.includes("tokenPair")) token = raw.match(/"token"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  }
  token ??= document.cookie.split("; ").find((c) => c.startsWith("yutoken="))?.split("=")[1];
  if (!token) return console.log("No token found. Storage keys:", Object.keys(localStorage));
  const all = [];
  for (let skip = 0; ; skip += 100) {
    const body = new URLSearchParams({
      action: "cln_market_search", token, skip, count: 100, text: "",
      language: "en_US", options: "any_sell_orders;include_marketpairs", appid_filter: "1067",
    });
    const r = await (await fetch("https://market-proxy.gaijin.net/web", { method: "POST", body })).json();
    if (r?.response?.success === false) return console.log("Market said:", r.response.error);
    const items = (r.response || r.result || {}).assets || [];
    all.push(...items);
    if (items.length < 100) break;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(all)], { type: "application/json" }));
  a.download = "wt-market.json";
  a.click();
})();
```

Prices are integers in 1e-8 GJN (`price` = lowest sell offer, `buy_price` = best buy order).
