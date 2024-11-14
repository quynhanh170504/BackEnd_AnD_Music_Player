const express = require("express");
const path = require("path");

const app = express();
const PORT = 3177; // Bạn có thể thay đổi port này

// Static route để phục vụ các file từ thư mục "music"
app.get("/", (req, res) => {
  res.send("Hello");
});
app.use("/music", express.static(path.join(__dirname, "music")));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
