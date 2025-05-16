import { useEffect, useState } from "react";
import { data, redirect } from "react-router";

import type { Route } from "./+types/storage-access";

type StorageState = PermissionState | null;

async function checkStorageAccess(): Promise<StorageState> {
  if (!document.hasStorageAccess) {
    // The storage access API isn't supported or access has been granted.
    return "granted";
  }

  let hasStorageAccess = await document.hasStorageAccess();
  if (hasStorageAccess) {
    return "granted";
  }

  try {
    let permission = await navigator.permissions.query({
      name: "storage-access" as PermissionName,
    });
    if (permission.state === "granted") {
      // Permission was granted, continue without user interaction
      await document.requestStorageAccess();
    }
    return permission.state;
  } catch (err) {
    console.error(`Unable to access permission state: ${err}`);
    return "denied";
  }
}

async function requestStorageAccess(callback: (hasAccess: boolean) => void) {
  try {
    await document.requestStorageAccess();
    callback(true);
  } catch (err) {
    console.error(`Unable to obtain storage access: ${err}`);
    callback(false);
  }
}

function useStorageAccess() {
  let [state, setState] = useState<StorageState>(null);

  useEffect(() => {
    checkStorageAccess()
      .then((state) => setState(state))
      .catch(() => setState("denied"));
  }, []);

  return state;
}

export async function loader({ request }: Route.LoaderArgs) {
  let url = new URL(request.url);
  let redirectUrl = new URL(url.searchParams.get("redirect") ?? "", url.origin);
  if (redirectUrl.origin !== url.origin) {
    throw data(
      {
        message: `The provided redirect URL "${redirectUrl.origin}" is invalid.`,
      },
      { status: 400 }
    );
  }

  if (!url.searchParams.has("embed")) {
    throw redirect(redirectUrl.toString());
  }
  return {
    redirect_url: redirectUrl.toString(),
  };
}

export default function StorageAccess({ loaderData }: Route.ComponentProps) {
  let { redirect_url: redirectUrl } = loaderData;
  let storageAccessState = useStorageAccess();

  if (storageAccessState === "granted") {
    return (
      <>
        <p>Click the button below to continue.</p>
        <button
          onClick={() => {
            window.location.href = redirectUrl;
          }}
        >
          Continue
        </button>
      </>
    );
  }
  if (storageAccessState === "prompt" || storageAccessState === "denied") {
    return (
      <>
        <p>Click the button below to grant storage access.</p>
        <button
          onClick={() => {
            requestStorageAccess(() => {
              window.location.href = redirectUrl;
            });
          }}
        >
          Grant access
        </button>
      </>
    );
  }
  return "Loading...";
}
