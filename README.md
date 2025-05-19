# React Router with Storage Access Headers

## Steps to Reproduce

1. Run `npm install` to install dependencies.
2. Run `npm run incorrect` to start the app at [http://localhost:3000](http://localhost:3000) and serve a static `iframe.html` file located at `/public/iframe.html` via [http://127.0.0.1:4000](http://127.0.0.1:4000).
3. Open the iframe at [http://127.0.0.1:4000](http://127.0.0.1:4000).
4. Grant storage access by clicking the button inside the iframe.
5. You should see the URL from both `window.location.href` and `request.url` (exposed from the loader) which should be identical.
6. Reload the page.

## Actual Behavior

After reloading the iframe page, the client-side and server-side URLs differ.
The loader reports the URL as `http://127.0.0.1:4000`, while `window.location.href` shows `http://localhost:3000`.

Even when loading the app within an iframe, the URL should never reflect the parent page.

When opening the app directly at [http://localhost:3000](http://localhost:3000), i.e., outside of an iframe, both URLs are the same (expected behavior), even after a reload.

The same (correct) behavior can be observed when running `npm run correct`.
This starts a version of the app rebuilt as a pure Express application.
If you follow the same steps, you’ll observe that both URLs are always identical.
