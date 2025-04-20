const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http); // socket io for real time updates

app.use(express.static(path.join(__dirname, "public")));

// handle default route (show index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// listen to connected clients
io.on("connection", (socket) => {
  // console.log('A user connected');

  socket.on("caption", (data) => {
    // broadcast caption to everyone
    io.emit("caption", data);
  });

  // socket.on('disconnect', () => {
  //   console.log('User disconnected');
  // });
});

http.listen(3005, () => {
  console.log("Caption server running on http://localhost:3005");
});
