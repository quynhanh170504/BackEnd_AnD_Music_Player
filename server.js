
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
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting all songs')
      return res.json({Status: "Error", Error: err})
    }
    return res.json(result)
  })
})

app.get('/get-top-albums', (req, res) => {
  console.log('call me get top albums')
  const sql = `
    select * from album b
    join author a on b.authorid = a.authorid
    limit 5
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting top albums')
      return res.json({Status: "Error", Error: err})
    }
    return res.json(result)
  })
})

app.get('/get-listsongs-by-albumid', (req, res) => {
  console.log('call me get list songs by album id')
  const albumid = req.query.albumid
  const sql = `
    select * from song s
    join author a on s.authorid = a.authorid
    where albumid = ${albumid}
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting list songs by album id')
      return res.json({Status: "Error", Error: err})
    }
    return res.json(result)
  })
})

app.get('/get-playlist-by-userid', (req, res) => {
  const {userid} = req.query
  const sql = `
    select * from playlist 
    where userid = ${userid}
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while add song to playlist')
      return res.json({Status: 'Error', Error: err})
    }
    return res.json({Status: 'Success', Result: result})
  })
}) 

app.post('/add-song-to-playlist', (req, res) => {
  console.log('call me add song to playlist')
  const sql = `
    insert into playlist_song (playlistid, songid) values (?)
  `
  const values = [
    req.body.playlistid,
    req.body.songid
  ]
  db.query(sql, [values], (err, result) => {
    if(err) {
      console.log('Error while add song to playlist')
      return res.json({Status: 'Error', Error: err})
    }
    return res.json({Status: 'Success'})
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});