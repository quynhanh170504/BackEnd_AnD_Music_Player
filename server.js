
import express from 'express'
import mysql from 'mysql'
import path from 'path'
import cors from 'cors'
import bcrypt from 'bcrypt'

import {fileURLToPath} from 'url'

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

//Đăng ký tài khoản mới
app.post('/register', (req, res) => {
  console.log('call me register')
  const sql_check_if_exist = 'select * from user where useremail = ? or userphone = ?'
  db.query(sql_check_if_exist, [req.body.email, req.body.phone], (err, checkResult) => {
    if(err) return res.json({Status: 'Error', Error: err})
    if(checkResult.length > 0) {
      return res.json({Status: 'Error', Error: 'Email hoặc số điện thoại đã tồn tại'})
    }
    else {
      const sql = 'insert into user(username, userphone, userpass, useremail) values (?)'
      bcrypt.hash(req.body.pass.toString(), salt, (err, hash) => {
        if (err) return res.json({Status: 'Error', Error: 'error for hashing password' })
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
          return res.json({ Status: 'Success'})
        }
        else {
          return res.json({ Status: 'Error', Error: 'Wrong password' })
        }
      })
    } else {
      return res.json({ Status: 'Error', Error: "User with given email doesn't exist!" })
    }
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});