
import express from 'express'
import mysql from 'mysql'
import path from 'path'
import cors from 'cors'
import bcrypt from 'bcrypt'
import multer from 'multer'

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
          return res.json({ Status: 'Success', userid: result.insertId })
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
          return res.json({
            Status: 'Success',
            userid: data[0].userid,
            username: data[0].username,
            useravatar: data[0].useravatar
          })
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
app.post('/add-new-playlist', (req, res) => {
  console.log('call me add new playlist');
  const sql = `
    INSERT INTO playlist (playlistname, userid) VALUES (?, ?)
  `;
  const values = [req.body.playlistname, req.body.userid];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error while creating new playlist:', err);
      return res.json({ Status: 'Error', Error: err });
    }

    // If successful, send back the playlistid (result.insertId)
    return res.json({ Status: 'Success', playlistid: result.insertId });
  });
});


//Tạo playlist favorite
app.post('/add-favourite-playlist', (req, res) => {
  console.log('call me add favourite playlist');
  const sql = `
  INSERT INTO playlist (playlistname, playlistimg, userid) 
  VALUES ('Favourite', '/image/album/favouriteicon.png', ?)
  `;

  const userid = req.body.userid;
  console.log(userid);
  db.query(sql, [userid], (err, result) => {
    if (err) {
      console.log('Error while create favourite playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success' })
  })
})


//Thêm bài hát vào danh sách phát
app.post('/add-song-to-playlist', (req, res) => {
  console.log('call me add song to playlist')
  const sql_check_if_exist_song = `
  select * 
  from playlist_song 
  where playlistid = ? and songid = ?`
  const sql = `
    insert into playlist_song (playlistid, songid) values (?,?)
  `
  const values = [
    req.body.playlistid,
    req.body.songid
  ]
  db.query(sql_check_if_exist_song, values, (err, checkResult) => {
    if (err) {
      console.log('Error while check if song exist in playlist')
      return res.json({ Status: 'Error', Error: err })
    }
    if (checkResult.length > 0) {
      return res.json({ Status: 'Error', Error: 'Song already exist in your playlist' })
    }
    db.query(sql, values, (err, result) => {
      if (err) {
        console.log('Error while add song to playlist', err)
        return res.json({ Status: 'Error', Error: err })
      }
      return res.json({ Status: 'Success' })
    })
  })
})

app.post('/add-song-to-favourite-playlist', (req, res) => {
  console.log('call me add song to favourite playlist')
  const sql_get_favourite_playlist_id = `
    select playlistid from playlist where playlistname = 'Favourite' and userid = ${req.body.userid}
  `
  db.query(sql_get_favourite_playlist_id, (err, result) => {
    if (err) {
      console.log('Error while get favourite playlist id')
      return res.json({ Status: 'Error', Error: err })
    }
    console.log('check result after getting playlistid: ', result[0].playlistid)
    const sql_check_if_exist = `
      select * from playlist_song where playlistid = ${result[0].playlistid} and songid = ${req.body.songid}
    `
    db.query(sql_check_if_exist, (err, checkResult) => {
      if (err) {
        console.log('Error while check if song exist in favourite playlist')
        return res.json({ Status: 'Error', Error: err })
      }
      if (checkResult.length > 0) {
        return res.json({ Status: 'Error', Error: 'Song already exist in your favourite playlist' })
      }
      const sql = `insert into playlist_song (playlistid, songid) values (?)`
      const values = [
        result[0].playlistid,
        req.body.songid
      ]
      db.query(sql, [values], (err, insert_result) => {
        if (err) {
          console.log('Error while add song to favourite playlist')
          return res.json({ Status: 'Error', Error: err })
        }
        return res.json({ Status: 'Success' })
      })
    })
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
    if (err) {
      console.log('Get error while get songs by genreid');
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json(result);
  })
})

app.get('/get-song-by-authorid', (req, res) => {
  console.log('Get songs by authorid');
  const authorid = req.query.authorid;
  const sql = `
    select s.*, a.authoravatar, a.authorname
    from song s
    join author a on s.authorid = a.authorid
    where s.authorid = ${authorid}
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log('Get error while get songs by authorid');
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success', Result: result });
    // return res.json(result);
  })
})

app.get('/get-song-by-songid', (req, res) => {
  const sql = `
    select * from song
    where songid = ${req.query.songid}
  `
  db.query(sql, (err, result) => {
    if(err) {
      console.log('Error while getting song by id: ', err)
      return  res.json({Status: 'Error', Error: err})
    }
    return res.json({Status: 'Success', Result: result})
  })
})

app.get('/check-is-followed', (req, res) => {
  console.log('call me check is followed')
  const sql_check_if_exist = `
    select * from user_author where authorid = ${req.query.authorid} and userid = ${req.query.userid}
  `
  db.query(sql_check_if_exist, (err, checkResult) => {
    if (err) {
      console.log('Error while check if author is followed')
      return res.json({ Status: 'Error', Error: err })
    }
    if (checkResult.length > 0) {
      return res.json({ Status: 'Existed' })
    }
    else {
      return res.json({ Status: 'NotExisted' })
    }
  })
})

app.post('/follow-author', (req, res) => {
  console.log('call me follow author')
  const sql_check_if_exist = `
    select * from user_author where authorid = ${req.body.authorid} and userid = ${req.body.userid}
  `
  db.query(sql_check_if_exist, (err, checkResult) => {
    if (err) {
      console.log('Error while check if author is followed')
      return res.json({ Status: 'Error', Error: err })
    }
    if (checkResult.length > 0) {
      return res.json({ Status: 'Existed', Error: 'Author is already followed' })
    }
    const sql = `
      insert into user_author (authorid, userid) values (?)
    `
    const values = [
      req.body.authorid,
      req.body.userid
    ]
    db.query(sql, [values], (err, result) => {
      if (err) {
        console.log('Error while follow author')
        return res.json({ Status: 'Error', Error: err })
      }
      return res.json({ Status: 'Success' })
    })
  })

})

app.post('/unfollow-author', (req, res) => {
  console.log('call me unfollow author')
  const sql_check_if_exist = `
    select * from user_author where authorid = ${req.body.authorid} and userid = ${req.body.userid}
  `
  db.query(sql_check_if_exist, (err, checkResult) => {
    if (err) {
      console.log('Error while check if author is followed')
      return res.json({ Status: 'Error', Error: err })
    }
    if (checkResult.length === 0) {
      return res.json({ Status: 'NotExisted', Error: 'Author is not followed' })
    }
    const sql = `
      delete from user_author where authorid = ${req.body.authorid} and userid = ${req.body.userid}
    `
    db.query(sql, (err, result) => {
      if (err) {
        console.log('Error while unfollow author')
        return res.json({ Status: 'Error', Error: err })
      }
      return res.json({ Status: 'Success' })
    })
  })
})

app.get('/get-all-followed-author-by-userid', (req, res) => {
  const sql = `
    select * from author a
    join user_author ua on a.authorid = ua.authorid
    where userid = ${req.query.userid}
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('error in get followed author')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success', Result: result })
  })
})

//Dùng multer cho avatar user
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`; // Đặt tên tệp duy nhất
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage
});

app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  console.log('call me upload-avatar');
  console.log(req.file.filename);
  if (!req.file) {
    return res.status(400).send('No file uploaded!');
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ Status: 'success', useravatar: fileUrl });
});

app.use('/uploads', express.static('uploads'));

//update username
app.put('/update-username', (req, res) => {
  const { userid, username } = req.body;
  const sql = `
    UPDATE user
    SET
      username = ?
    WHERE userid = ?
  `;
  db.query(sql, [username, userid], (err, result) => {
    if (err) {
      console.error('Error updating user info:', err);
      return res.status(500).json({ error: 'Server error while updating user info' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ Status: 'User updated successfully' });
  })
})

//update avatar
app.put('/update-useravatar', (req, res) => {
  console.log('call me update useravatar')
  const { userid, useravatar } = req.body;
  const sql = `
      UPDATE user
      SET
        useravatar = ?
      WHERE userid = ?
    `;
  db.query(sql, [useravatar, userid], (err, result) => {
    if (err) {
      console.error('Error updating user info:', err);
      return res.status(500).json({ error: 'Server error while updating user info' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ Status: 'User updated successfully' });
  })
})

//Delete a playlist
app.delete('/delete-playlist-by-id', (req, res) => {
  console.log('call me delete playlist by its id');
  const playlistid = req.query.playlistid;

  const sql_del_pl_song = `
    DELETE FROM playlist_song
    WHERE playlistid = ?
  `;
  db.query(sql_del_pl_song, [playlistid], (err, result) => {
    if (err) {
      return res.json({ Error: "Can't delete playlist_song" });
    }

    const sql_del_pl = `
      DELETE FROM playlist
      WHERE playlistid = ?
    `;
    db.query(sql_del_pl, [playlistid], (err, result) => {
      if (err) {
        return res.json({ Error: "Can't delete playlist" });
      }
      return res.json({ Status: 'Success delete playlist and playlist_song' });
    });
  });
});

//Delete a song from playlist
app.post('/delete-song-from-playlist', (req,res) => {
  console.log('call me delete song from playlist');
  const sql = `
    DELETE FROM playlist_song
    WHERE playlistid = ${req.body.playlistid}
    AND songid = ${req.body.songid}
  `
  db.query(sql,(err,result) => {
    if (err) {
      console.error('Error delete song from playlist:', err);
      return res.status(500).json({ error: 'Server error while updating playlist info' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    return res.status(200).json({ Status: 'Song got deleted successfully' });
  })
})

//Update playlist name
app.put('/update-playlistname', (req, res) => {
  console.log('call me update playlist name');
  const { playlistid, playlistname } = req.body;
  console.log(req.body);
  const sql = `
    UPDATE playlist
    SET
      playlistname = ?
    WHERE playlistid = ?
  `;
  db.query(sql, [playlistname, playlistid], (err, result) => {
    if (err) {
      console.error('Error updating user info:', err);
      return res.status(500).json({ error: 'Server error while updating playlist info' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    return res.status(200).json({ Status: 'Playlist updated successfully' });
  })
})

app.get('/get-detail-song-info', (req, res) => {
  console.log('call me get detail song info')
  const sql = `
    select songname, albumname, authorname, genrename
    from song s 
    left join album al on s.albumid = al.albumid
    join author au on au.authorid = s.authorid
    join genre g on s.genreid = g.genreid
    WHERE s.songid = ${req.query.songid}
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while getting detail song info')
      return res.json({ Status: 'Error', Error: 'Error while getting detail song info' })
    }
    return res.json({ Status: 'Success', Result: result })
  })
})

app.get('/count-favourite-by-songid', (req, res) => {
  const sql = `
    select count(*) as soluotthich
    from playlist_song 
    where songid = ${req.query.songid} and playlistid in (select playlistid from playlist where playlistname = 'Favourite')
  `
  db.query(sql, (err, result) => {
    if (err) {
      console.log('Error while counting favourite')
      return res.json({ Status: 'Error', Error: err })
    }
    return res.json({ Status: 'Success', Result: result })
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});