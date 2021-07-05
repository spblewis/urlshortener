require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
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

const validateURL = async (address) => {
  const url = new URL(address);

  return new Promise((resolve, reject) => {

    if (address === '') {
      reject(new Error('This is not a valid address'));
    }

    if (!url.hostname || !url.protocol || !url.protocol.match(/^https?:/)) reject(new Error('Invalid URL'));

    dns.lookup(url.hostname, {all: true}, (err) => {
      if (err) {
        reject(new Error('Invalid URL'));
      } else {
        resolve('ok');
      }
    });
  });
};

const checkDatabase = async (address) => {
  const haveThatOne = await urlRecord.findOne({ original_url: address}, '-_id -__v').exec();
  console.log(haveThatOne)
  if (haveThatOne) return haveThatOne;

  return undefined;
}


// The post method that does all the work
app.post('/api/shorturl', async (req, res) => {
  const address = req.body.url;
  try {
    // Check whether this already exists in the database
    const check = await checkDatabase(address);
    console.log(check);
    if (check) res.json(check);


    await validateURL(address);

    // Add a document to the database
    const num = await urlRecord.estimatedDocumentCount();

    newURL(address, num + 1);

    //show a json response to the user
    res.json({
      original_url: address,
      short_url: num ? num + 1 : 1
    });
  } catch (e) {
    res.json({ error: 'Invalid URL' });
  }
});

// Retrieve a short url from the database and redirect to its original url
app.get('/api/shorturl/:target', async (req, res) => {
  const target = +req.params.target;

  try {
    if (isNaN(target)) {
      res.json({ error: "This is not a valid short_url"});
    }

    const url = await urlRecord.findOne( { short_url: target });

    res.redirect(url.original_url);

  } catch (err) {

    console.error(err);
    res.json({ error: 'Something went wrong'})
  }

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
