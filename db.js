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
  const [res,fields] = await connection.promise().query("SELECT * FROM `users` WHERE `login` = '" + login + "' AND `password` = '" + password + "'")
  return res;
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
 
module.exports = q = {
  check_user,
  getMessages,
  newMessage
};
