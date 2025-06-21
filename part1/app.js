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

app.get('/api/dogs', async (req, res)=>{
 try{
 const[dogs]=await db.execute('
    SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username FROM Dogs JOIN User ON Dog.owner_id= Users.user_id
');
res.json(dogs);
}catch (err){
res.status(500).json({ error: did not fetch dog'});
}
});



router.get('/api/walkrequests/open', async (req, res) => {
    try {
        const db = req.db;

        
        const sql = `
            SELECT
                wr.request_id,
                d.name AS dog_name,
                wr.requested_time,
                wr.duration_minutes,
                wr.location,
                u.username AS owner_username
            FROM
                WalkRequests wr
            JOIN
                Dogs d ON wr.dog_id = d.dog_id
            JOIN
                Users u ON d.owner_id = u.user_id
            WHERE
                wr.status = 'open'
        `;

        const [results] = await db.execute(sql);
        res.json(results);

    } catch (error) {
        console.log("Something went wrong getting the walk requests:", error);
        res.status(500).json({
            error: "Could not get the walk requests"
        });
    }
});

module.exports = app;
