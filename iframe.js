import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 4000;

let app = express();

let __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "iframe.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
