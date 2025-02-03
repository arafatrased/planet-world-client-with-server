require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const port = process.env.PORT || 9000
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'));


// username: asadzasad1984
//pass: N9Trj6q4TKcYbNYL

//planetworld
//0UJHvvoifoT9R92S

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

const uri = "mongodb+srv://planetworld:0UJHvvoifoT9R92S@cluster0.7szto.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
    const userCollections = client.db('planet-worldDB').collection('users');
    const plantCollections = client.db('planet-worldDB').collection('plants')
    const ordersCollections = client.db('planet-worldDB').collection('orders')


    // save or update a user in db
    app.post('/users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email }
      const user = req.body
      //check if user exists in db
      const isExist = await userCollections.findOne(query)
      if (isExist) {
        return res.send(isExist)
      }
      const result = userCollections.insertOne({ ...user, timestamp: Date.now(), role: "customer" })
      res.send(result)
    })


    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    });

    // Getting Plants Data
    app.get('/plants', async (req, res) => {
      const result = await plantCollections.find().toArray()
      res.send(result);
    })

    app.get('/plants/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await plantCollections.findOne(query)
      res.send(result);
    });

    app.get('/customer-orders/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'customer.email': email }
      console.log(query)
      const result = await ordersCollections.aggregate([
        {
          $match: query
        },
        {
          $addFields: {
            plantId: { $toObjectId: '$plantId' }
          }
        },
        {
          $lookup: {
            from: 'plants',
            localField: 'plantId',
            foreignField: '_id',
            as: 'plants'
          }
        },
        {
          $unwind: '$plants'
        },
        {
          $addFields: {
            name: '$plants.name',
            image: '$plants.image',
            category: '$plants.category',
          },
        },
        {
          $project: {
            plants: 0
          }
        }
      ]).toArray()
      console.log(result)
      res.send(result)
    })





    app.get('/', (req, res) => {
      res.send('plannet is running')
    })


    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })


    app.post('/plants', async (req, res) => {
      const plant = req.body;
      const result = await plantCollections.insertOne(plant)
      res.send(result);
    })
    //Post Orders
    app.post('/orders', async (req, res) => {
      const orderInfo = req.body;
      const result = await ordersCollections.insertOne(orderInfo)
      res.send(result);
    })

    //Manage Quantity
    app.patch('/plant/quantity/:id', async (req, res) => {
      const id = req.params.id;
      const { quantityToUpdate, status } = req.body;
      const filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $inc: {
          quantity: -quantityToUpdate
        }
      }
      if(status === 'increase'){
        updateDoc = {
          $inc: {
            quantity: quantityToUpdate
          }
        }
      }
      const result = plantCollections.updateOne(filter, updateDoc);
      res.send(result)

    });

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const order = await ordersCollections.findOne(query)
      if(order.status === 'Delivered'){
        return res.status(409).send('can not delete when delivered')
      }
      const result = await ordersCollections.deleteOne(query);
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})
