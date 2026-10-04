export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 16px/1.6 "Nunito Sans", system-ui, -apple-system, sans-serif; background: #f2ebe0; color: #3a2a1f; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      @media (prefers-color-scheme: dark) { body { background: #1d1612; color: #ece4d6; } p { color: #b8ab98 !important; } .secondary { background: transparent !important; color: #ece4d6 !important; border-color: #5a4b40 !important; } }
      .card { max-width: 30rem; width: 100%; padding: 2rem; }
      .eyebrow { font-family: Lora, Georgia, serif; font-style: italic; color: #b8774f; margin: 0 0 0.25rem; }
      h1 { font-family: Lora, Georgia, serif; font-weight: 400; font-size: 2.5rem; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 0.75rem; }
      p { color: #7a6a5c; margin: 0 0 1.75rem; }
      .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
      a, button { padding: 0.7rem 1.4rem; border-radius: 999px; font: inherit; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #3a2a1f; color: #f2ebe0; }
      .secondary { background: transparent; color: #3a2a1f; border-color: #cbbba6; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">something came unpinned</p>
      <h1>This page didn't load.</h1>
      <p>It's on our side, not yours. Try again, or head back to the board.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Back to the board</a>
      </div>
    </div>
  </body>
</html>`;
}
