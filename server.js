
import express from 'express'
import mysql from 'mysql'
import path from 'path'
import cors from 'cors'

import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3177; // you can change this port
app.use(cors())

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "and_music"
});

// static route to serve files from 'music' folder
app.use("/music", express.static(path.join(__dirname, "music")));

app.get('/get-all-author', (req, res) => {
  console.log('call me get all author')
  const sql = `
    select * from author
  `
  db.query(sql, (err, result) => {
    if(err) return res.json({Status: 'Error', Error: err})
    return res.json(result)
  })
})

app.get('/get-songs-for-quickpick', (req,res) => {
  console.log('call me get all songs')
  const sql = `
    select * from song s
    join author a on s.authorid = a.authorid
    limit 12
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting songs for quickpick')
      return res.json({Status: "Error", Error: err})
    }
    return res.json(result)
  })
})

app.get('/get-all-songs', (req, res) => {
  console.log('call me get all songs')
  const sql = `
    select * from song s
    join author a on s.authorid = a.authorid
    limit 3
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting all songs')
      return res.json({Status: "Error", Error: err})
    }
    return res.json(result)
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});