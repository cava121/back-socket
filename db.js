const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '77.222.61.25',
  user: 'fs1998mai2_chat',
  database: 'fs1998mai2_chat',
  password: 'ifacevibiw1A',
});

connection.connect((err) => {
  if (err) {
    return console.log(err);
  }
});

check_user = async (user) => {
  let { login, password, room } = user;
  const [res] = await connection.promise().query("SELECT * FROM `users` WHERE `login` = '" + login + "' AND `password` = '" + password + "'")
  if(res[0].admin) {
    return res;
  } else {
    let [result] = await connection.promise().query("SELECT * FROM `users_rooms` WHERE `id_user` = '" + res[0].id + "'")
    let isАccess = result[0].rooms.split(',').some(item => item == room)
    if(isАccess) {
      return res;
    } else {
      return 'noAccess';
    }
    
  }
};  

getMessages = async (roomId) => {
  roomId = roomId.toString();
  const [res] = await connection.promise().query("SELECT * FROM `messages` WHERE id_room =" + roomId)
  return res;
}

newMessage = async ({text, id_user , name_send, data_send, id_room}) => {
  const [res] = await connection.promise().query("INSERT INTO `messages` (`text`, `id_user`, `name_send`, `data_send`, `id_room`) VALUES ('"+text+"','"+id_user+"','"+name_send+"','"+data_send+"','"+id_room+"')")
  return res;
}

getUsers = async () => {
  const [res] = await connection.promise().query("SELECT users.email, users.id, users.name, users.login, users.admin, users_rooms.rooms FROM users LEFT JOIN users_rooms ON users_rooms.id_user = users.id;")
  return res
}

getRooms = async () => {
  const [res] = await connection.promise().query("SELECT * FROM `rooms`");
  return res
}

changeUserData = async ( {email, login, name, admin, rooms, id}) => {
  const [res] = await connection.promise().query("UPDATE `users` SET `email` = '"+email+"' , `name` = '"+name+"' , `admin` = '"+admin+"' WHERE `id` = '"+id+"'");
  if(rooms != null) {
    const [res] = await connection.promise().query("SELECT COUNT(*) as count FROM `users_rooms` WHERE `id_user` = '"+id+"'");
    if(res[0].count > 0) {
      const [res] = await connection.promise().query("UPDATE `users_rooms` SET `rooms` = '"+rooms+"' WHERE `id_user` = '"+id + "'");
      return res
    } else {
      const [res] = await connection.promise().query("INSERT INTO `users_rooms` (`id_user`, `rooms`) VALUES('"+id+"', '"+rooms+"')");
      return res
    }
   
  }
  return res
}

deleteUsers = async ( {userId} ) => {
  await connection.promise().query("DELETE FROM `users` WHERE `id` = '"+userId+"'");
  await connection.promise().query("DELETE FROM `users_rooms` WHERE `id_user` = '"+userId+"'");
}

createUser = async ( {email, login, name, admin, rooms, password} ) => {
  const [res] = await connection.promise().query("INSERT INTO `users` (`email`, `name`, `login`, `password`, `admin`) VALUES ('"+email+"', '"+name+"', '"+login+"', '"+password+"', '"+admin+"')");
  if(!admin) {
    await connection.promise().query("INSERT INTO `users_rooms` (`id_user`, `rooms`) VALUES('"+res.insertId+"', '"+rooms+"')")
  }
}

deleteRoom = async ( {roomId} ) => {
  await connection.promise().query("DELETE FROM `rooms` WHERE `id` = '"+roomId+"'");
}

updateDataRoom = async ( {id, name} ) => {
  const [res] = await connection.promise().query("UPDATE `rooms` SET `name` = '"+name+"' WHERE `id` = '"+id+"'")
}

createRoom = async ( { name } ) => {
  await connection.promise().query("INSERT INTO `rooms` (`name`) VALUES ('"+name+"')");
}
 
module.exports = q = {
  check_user,
  getMessages,
  newMessage,
  getUsers,
  getRooms,
  changeUserData,
  deleteUsers,
  createUser,
  deleteRoom,
  updateDataRoom,
  createRoom
};
