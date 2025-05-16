import type React from "react";
import {
  type unstable_MiddlewareFunction,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

const checkStorageAccessHeaders: unstable_MiddlewareFunction = async (
  { request },
  next
) => {
  let url = new URL(request.url);
  if (!url.searchParams.has("embed") || url.pathname === "/storage-access") {
    return;
  }

  let storageAccessHeader = request.headers.get("sec-fetch-storage-access");
  if (storageAccessHeader === "inactive") {
    // User needs to grant permission, retry with allowed origin
    let origin = request.headers.get("origin");
    throw new Response("", {
      status: 401,
      headers: {
        "Activate-Storage-Access": `retry; allowed-origin="${origin ?? "*"}"`,
      },
    });
  }

  let response = (await next()) as Response;
  if (storageAccessHeader === "active") {
    // User has granted permission, proceed with access
    response.headers.set("Activate-Storage-Access", "load");
    throw response;
  }
  throw redirect(`/storage-access?redirect=${url.toString()}&embed`);
};

export let unstable_middleware = [checkStorageAccessHeaders];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
