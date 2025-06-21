var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/api/dogs', asynv (req, res)=>{
 try{
 const[dogs]=await db.execute('
    SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username FROM Dogs JOIN User ON Dog.owner_id= Users.user_id
');
res.json(dogs);
}catch (err){
res.status(500).json({ error: did not fetch dog'});
}
});

app.get('/api/walkrequests/open', async (req, res))




module.exports = app;
