const { getRoomId, chatSaver } = require("../helpers/helper");
const { jwtAuth } = require("../middleware/middleware");

let messages = {};

module.exports = {
  socketConnect: (socket) => {
    messages = {};
    socket.join("room")
    console.log("a user connected " + socket.id);
    socket.emit("me", socket.id);
    socket.on("disconnect", () => {
      socket.broadcast.emit("callEnded");
    });

    socket.on("chatUser", async (data) => {
      let user = await jwtAuth(data.token);
      let a = await getRoomId(user, data.otherUser);
      if(a){
        socket.join(a?._id + "");
        socket.emit("prevChat", {data:a?.chat,room:a?._id});
      }
      else{
        return false;

      }
    });

  

    socket.on("answerCall", async (data) => {
      console.log(data);
      let user = await jwtAuth(data.token);
      let a = await getRoomId(user, data.otherUser);
      chatSaver(a._id + "", user, data.msg);
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      let currentMinute = currentDate.getMinutes() + "";
      if (currentMinute.length < 2) {
        currentMinute = 0 + currentMinute;
      }
      socket
        .to(a._id + "")
        .emit("answer", {
          user,
          chat: data.msg,
          time: currentHour + ":" + currentMinute,
        });
    });


socket.on("user:entered",({room})=>{
  console.log(`user enterred to ${room}`);
  socket.to(room).emit("user:joined","user Joined")
})
socket.on("user:sendoffer",({offer,room})=>{
  console.log(offer,room);
  socket.to(room).emit("user:recieveoffer",offer)
})
socket.on("user:sendAns",({answer,room})=>{
  
  socket.to(room).emit("user:acceptAns",answer)
})


    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  },
};
