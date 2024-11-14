
import express from 'express'
import path from 'path'
import cors from 'cors'

import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3177; // you can change this port
app.use(cors())

// static route to serve files from 'music' folder
app.get("/", (req, res) => {
  res.send("Hello");
});
app.get("/hello", (req, res) => {
  res.send("Hello again")
})
app.use("/music", express.static(path.join(__dirname, "music")));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
