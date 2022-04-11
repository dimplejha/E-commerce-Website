const express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer') 
const mongoose = require('mongoose')
const route = require('./routes/routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

app.use('/', route);

mongoose.connect("mongodb+srv://dimplejha_17:osVxDHqCJxxpeWGN@cluster0.ut3on.mongodb.net/group31Database?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log('MongoDB is connected.......'))
    .catch(err => console.log(err))

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});