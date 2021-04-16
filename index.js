const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9zre.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());



var serviceAccount = require("./delivery-service-344e8-firebase-adminsdk-xudfd-c1c5783ae6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const port = process.env.PORT || 5000

app.get('/', (req, res) =>{
    res.send("hello delivery")
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const servicesCollection = client.db("deliveryService").collection("services");
  const ordersCollection = client.db("deliveryService").collection("orders");
  
    app.get('/services', (req, res) =>{
      servicesCollection.find({})
      .toArray( (err, documents) => {
        res.send(documents);
      })
    })

    app.get('/service/:id', (req, res) => {
      servicesCollection.find({_id: ObjectId(req.params.id)})
      .toArray( (err, documents) =>{
        res.send(documents[0]);
      })
    })
    
    app.post('/addService', (req, res) =>{
      const book = req.body;
      servicesCollection.insertOne(book)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    })

    app.post('/addOrder', (req, res) => {
      const newOrder = req.body;
      ordersCollection.insertOne(newOrder)
          .then(result => {
              res.send(result.insertedCount > 0);
          })
  })

    app.delete('/deleteService/:id', (req, res) => {
      servicesCollection.deleteOne({_id: ObjectId(req.params.id)})
      .then(result => {
        res.send(result.deletedCount > 0);
      })
    })

    app.get('/orders', (req, res) => {
      const bearer = req.headers.authorization;
      if (bearer && bearer.startsWith('Bearer ')) {
          const idToken = bearer.split(' ')[1];
          // idToken comes from the client app
          admin.auth().verifyIdToken(idToken)
              .then((decodedToken) => {
                  const tokenEmail = decodedToken.email;
                  const queryEmail = req.query.email;
                  if (tokenEmail == queryEmail) {
                      ordersCollection.find({ email: queryEmail })
                          .toArray((err, documents) => {
                              res.status(200).send(documents);
                          })
                  }
                  else {
                      res.status(401).send('unauthorized access')
                  }
              })
              .catch((error) => {
                  res.status(401).send('unauthorized access');
              });
      }
      else {
          res.status(401).send('unauthorized access');
      }
  })

});


app.listen(port)