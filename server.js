const q = require('./db');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');

const app = express();

const server = require('http').Server(app);
const io = socket(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credential: true,
    transport: ['websocket'],
  },
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

app.get('/users', (req, res) => {
  q.getUsers().then((users) => {
    res.json(users);
  });
});

app.post('/create_room', (req, res) => {
  q.createRoom(req.body).then(() => {
    res.json('ok');
  });
});

app.post('/data_room', (req, res) => {
  q.updateDataRoom(req.body).then(() => {
    res.json('ok');
  });
});

app.post('/delete_users', (req, res) => {
  q.deleteUsers(req.body).then(() => {
    res.json('ok');
  });
});

app.post('/delete_room', (req, res) => {
  q.deleteRoom(req.body).then(() => {
    res.json('ok');
  });
});

app.post('/create_user', (req, res) => {
  q.createUser(req.body).then(() => {
    res.json('ok');
  });
});

app.post('/users', (req, res) => {
  q.changeUserData(req.body).then(() => {
    res.json('ok');
  });
});

app.get('/rooms', (req, res) => {
  q.getRooms().then((rooms) => {
    res.json(rooms);
  });
});

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
    if (response == 'noAccess') {
      return res.json({
        error: 'Нет доступа для этой комнаты',
      });
    }
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
});
