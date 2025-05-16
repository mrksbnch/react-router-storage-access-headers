import express from "express";
import cookieParser from "cookie-parser";

const PORT = 3000;

let app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(checkStorageAccessHeaders);

app.get("/", handleHomePage);
app.get("/storage-access", handleStorageAccessPage);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function checkStorageAccessHeaders(req, res, next) {
  let url = new URL(req.protocol + "://" + req.get("host") + req.originalUrl);
  let storageAccessHeader = req.get("sec-fetch-storage-access");
  if (!url.searchParams.has("embed") || url.pathname === "/storage-access") {
    return next();
  }

  if (storageAccessHeader === "inactive") {
    let origin = req.get("origin");
    return res
      .status(401)
      .set(
        "Activate-Storage-Access",
        `retry; allowed-origin="${origin || "*"}"`
      )
      .end();
  }

  if (storageAccessHeader === "active") {
    res.set("Activate-Storage-Access", "load");
    return next();
  }

  return res.redirect(
    `/storage-access?redirect=${encodeURIComponent(url.toString())}&embed`
  );
}

function handleHomePage(req, res) {
  let url = `${req.protocol}://"${req.get("host")}${req.originalUrl}`;
  let scriptTag = `
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        let h2 = document.createElement("h2");
        h2.textContent = "From Client Side";

        let pre = document.createElement("pre");
        pre.textContent = JSON.stringify(
          { url: window.location.href }
        );

        document.body.prepend(pre);
        document.body.prepend(h2);
      });
    </script>
  `;

  res.send(`
    <html>
      <body>
        ${scriptTag}
        <h2>From Server Side</h2>
        <pre>${JSON.stringify({ url }, null, 2)}</pre>
      </body>
    </html>
  `);
}

function handleStorageAccessPage(req, res) {
  let redirectParam = req.query.redirect;
  try {
    let redirectURL = new URL(
      String(redirectParam),
      `http://${req.headers.host}`
    );
    if (redirectURL.origin !== `http://${req.headers.host}`) {
      return res.status(400).send("Invalid redirect URL");
    }
    if (req.query.embed == undefined) {
      return res.redirect(redirectURL.toString());
    }

    return res.send(`
      <html>
        <body>
          <script>
            async function checkAndRequestAccess() {
              if (!document.hasStorageAccess) {
                document.getElementById("grant").style.display = "none";
                document.getElementById("continue").style.display = "block";
                return;
              }

              let hasAccess = await document.hasStorageAccess();
              if (hasAccess) {
                window.location.href = "${redirectURL.toString()}";
                return;
              }

              document.getElementById("grant").style.display = "block";
              document.getElementById("continue").style.display = "none";
            }

            async function grantAccess() {
              try {
                await document.requestStorageAccess();
                window.location.href = "${redirectURL.toString()}";
              } catch {
                alert("Failed to gain access");
              }
            }

            window.onload = checkAndRequestAccess;
          </script>
          <p id="grant" style="display:none;">
            Click the button to grant storage access.
            <button onclick="grantAccess()">Grant Access</button>
          </p>
          <p id="continue" style="display:none;">
            Click to continue.
            <button onclick="window.location.href='${redirectURL.toString()}'">Continue</button>
          </p>
        </body>
      </html>
    `);
  } catch {
    return res.status(400).send("Malformed redirect URL");
  }
}
