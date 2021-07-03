require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Mongoose schema and model definitions
const { Schema } = mongoose;

// To store a counter in the database

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

const urlRecord = mongoose.model('urlRecord', urlSchema);

const newURL = (address, num) => {
  const thisURL = new urlRecord({
    original_url: address,
    short_url: num
  });

  thisURL.save((err, data) => {
    if (err) return console.error(err);
  });
};

//Use a counter to set short urls
const urlCounter = (function() {
  let counter = 0;
  return function() {
    counter++;
    return counter;
  }
})();



// FCC's example API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// The post method that does all the work
app.post('/api/shorturl', (req, res) => {
  // Check whether this already exists in the database

  // Add a document to the database
  let urlNumber = urlCounter();
  newURL(req.body.url, urlNumber);

  //show a json response to the user
  res.json({
    original_url: req.body.url,
    short_url: urlNumber
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
