import { useEffect, useState } from "react";

import type { Route } from "./+types/url";

function useHref() {
  let [href, setHref] = useState<string>();
  useEffect(() => {
    setHref(window.location.href);
  }, []);
  return href;
}

export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  return {
    url: url.toString(),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  let crtHref = useHref();

  return (
    <>
      <h2>From Client Side</h2>
      <pre>{JSON.stringify({ url: crtHref }, null, 2)}</pre>
      <h2>From Server Side</h2>
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
    </>
  );
}
