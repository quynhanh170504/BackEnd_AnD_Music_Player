
import express from 'express'
import mysql from 'mysql'
import path from 'path'
import cors from 'cors'
import bcrypt from 'bcrypt'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3177; // you can change this port
app.use(cors())
app.use(express.json())

const salt = 10

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "and_music"
});

// static route to serve files from 'music' folder
app.use("/music", express.static(path.join(__dirname, "music")));
app.use("/image", express.static(path.join(__dirname, "image")));

app.get('/get-all-author', (req, res) => {
  console.log('call me get all author')
  const sql = `
    select * from author
  `
  db.query(sql, (err, result) => {
    if (err) return res.json({ Status: 'Error', Error: err })
    return res.json(result)
  })
})

app.get('/get-songs-for-quickpick', (req, res) => {
  console.log('call me get all songs')
  const sql = `
    select * from song s
    join author a on s.authorid = a.authorid
    limit 12
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while getting songs for quickpick')
      return res.json({ Status: "Error", Error: err })
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
    if (err) {
      console.log('Error while getting all songs')
      return res.json({ Status: "Error", Error: err })
    }
    return res.json(result)
  })
})

//Lấy ra toàn bộ bài hát và kèm tác giả và thể loại
app.get('/get-all-songs-with-author-and-genre', (req, res) => {
  console.log('call me get all songs with author and genre')
  const sql = `
    SELECT * 
    FROM song s 
    JOIN genre g 
    ON g.genreid = s.genreid
    JOIN author a
    ON a.authorid = s.authorid
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while getting all songs with author and genre')
      return res.json({ Status: "Error", Error: err })
    }
    return res.json(result)
  })
})

//Đăng ký tài khoản mới
app.post('/register', (req, res) => {
  console.log('call me register')
  const sql_check_if_exist = 'select * from user where useremail = ? or userphone = ?'
  db.query(sql_check_if_exist, [req.body.email, req.body.phone], (err, checkResult) => {
    if (err) return res.json({ Status: 'Error', Error: err })
    if (checkResult.length > 0) {
      return res.json({ Status: 'Error', Error: 'Email hoặc số điện thoại đã tồn tại' })
    }
    else {
      const sql = 'insert into user(username, userphone, userpass, useremail) values (?)'
      bcrypt.hash(req.body.pass.toString(), salt, (err, hash) => {
        if (err) return res.json({ Status: 'Error', Error: 'error for hashing password' })
        const values = [
          req.body.username,
          req.body.phone,
          hash,
          req.body.email
        ]
        db.query(sql, [values], (err, result) => {
          if (err) return res.json({ Status: 'Error', Error: 'Inseting data Error in server' })
          return res.json({ Status: 'Success' })
        })
      })
    }
  })

})

//Xử lý đăng nhập
app.post('/login', (req, res) => {
  const sql = 'select * from user where useremail = ?'
  db.query(sql, [req.body.email], (err, data) => {
    if (err) return res.json({ Status: 'Error', Error: err })
    if (data.length > 0) {
      bcrypt.compare(req.body.pass.toString(), data[0].userpass, (err, response) => {
        if (err) return res.json({ Status: 'Error', Error: 'You enter the wrong password' })
        if (response) {
          console.log(data[0].userid)
          return res.json({ Status: 'Success', userid: data[0].userid })
        }
        else {
          return res.json({ Status: 'Error', Error: 'Wrong password' })
        }
      })
    } else {
      return res.json({ Status: 'Error', Error: "User with given email doesn't exist!" })
    }
  });
});

app.get('/get-top-albums', (req, res) => {
  console.log('call me get top albums')
  const sql = `
    select * from album b
    join author a on b.authorid = a.authorid
    limit 5
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while getting top albums')
      return res.json({ Status: "Error", Error: err })
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
    if (err) {
      console.log('Error while getting list songs by album id')
      return res.json({ Status: "Error", Error: err })
    }
    return res.json(result)

  })
})

//Lấy ra các bài hát của playlist
app.get('/get-listsongs-by-playlistid', (req, res) => {
  console.log('call me get list songs by playlist id')
  const playlistid = req.query.playlistid;
  const sql = `
    select * from song s 
    join playlist_song ps on s.songid = ps.songid 
    join author a on s.authorid = a.authorid
    where ps.playlistid = ${playlistid}
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while getting list songs by album id')
      return res.json({ Status: "Error", Error: err })
    }
    return res.json(result)

  })
})

app.get('/get-playlist-by-userid', (req, res) => {
  const userid = req.query.userid;
  const sql = `
    SELECT pl.*, COUNT(pls.songid) AS numsongs 
    FROM playlist pl
    LEFT JOIN playlist_song pls 
    ON pl.playlistid = pls.playlistid
    WHERE pl.userid = ${userid}
    GROUP BY pl.playlistid;
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while add song to playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success', Result: result })
  })
})

//Tạo playlist mới
app.post('/add-new-playlist', (req,res) => {
  console.log('call me add new playlist');
  const sql = `
    insert into playlist (playlistname,userid) values (?)
  `
  const values = [req.body.playlistname, req.body.userid];
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.log('Error while create new playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success' })
  })
})

//Tạo playlist favorite
app.post('/add-favourite-playlist', (req,res) => {
  console.log('call me add favourite playlist');
  const sql = `
    insert into playlist (playlistname,playlistimg,userid) values (Favorite,/image/album/favouriteicon.png,?)
  `
  const values = [req.body.userid];
  db.query(sql, [values], (err, result) => {
    if (err) {
      console.log('Error while create favourite playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success' })
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
    if (err) {
      console.log('Error while add song to playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success' })
  })
})

//Lấy toàn bộ genres
app.get('/get-all-genres', (req, res) => {
  console.log('Get all genre clicked');
  const sql = 'select * from genre'

  db.query(sql, (err, result) => {
    if (err) {
      console.log('get error when get genres');
      return res.json({ Status: 'Error', Error: err });
    }
    return res.json(result);
  })
})

//Lấy các bài hát thuộc 1 genre
app.get('/get-songs-by-genreid', (req, res) => {
  console.log('Get songs by genreid');
  const genreid = req.query.genreid;
  const sql = `select * 
               from song 
               where genreid = ${genreid}
  `;

  db.query(sql, (err, result) => {
    if(err){
      console.log('Get error while get songs by genreid');
      return res.json({Status: 'Error', Error: err})
    }
    return res.json(result);
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});