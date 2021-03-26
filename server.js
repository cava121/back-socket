const q = require('./db');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');

const app = express();

const server = require('http').Server(app);
const io = socket(server, {
  cors: {
    origin: 'http://localhost:3000/',
    methods: ['GET', 'POST'],
    credential: true,
    transport: ['websocket'],
  },
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

app.post('/data_room/:id', async (req, res) => {
  const roomId = req.params.id;

  const obj = {
    users: [...rooms.get(roomId).get('users').values()],
    messages: await q.getMessages(roomId),
  };
  res.json(obj);
});

app.post('/room/:id', (req, res) => {
  const roomId = req.params.id;
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map([['users', new Map()]]));
  }
  res.send();
});

app.post('/check_user', (req, res) => {
  q.check_user(req.body).then((response) => {
    if (!response.length) {
      return res.json({
        error: 'Неверный логин или пароль',
      });
    }
    res.json({ user: response[0] });
  });
});

io.on('connection', (socket) => {
  socket.on('JOIN', ({ roomId, name, userId }) => {
    console.log("подключился"+ socket.id)
    socket.join(roomId);
    rooms.get(roomId).get('users').set(socket.id, {
      id: userId,
      name,
    });
    socket.emit('JOINED');
  });

  socket.on('SEND_ALL_JOIN', ({ roomId }) => {
    const users = [...rooms.get(roomId).get('users').values()];
    socket.broadcast.to(roomId).emit('SET_USERS', users);
  });

  socket.on('NEW_MESSAGE', (data) => {
    const roomId = data.id_room;
    q.newMessage(data).then(() => {
      socket.broadcast.to(roomId).emit('NEW_MESSAGE', data);
    });
  });

  socket.on('disconnect', () => {
    rooms.forEach((value, roomId) => {
      if (value.get('users').delete(socket.id)) {
        const users = [...value.get('users').values()];
        socket.broadcast.to(roomId).emit('SET_USERS', users);
      }
    });
  });
});

server.listen(9999, (err) => {
  if (err) {
    throw Error(err);
  }
  console.log("соединение установлено")
});
