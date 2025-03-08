require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const nodemailer = require("nodemailer");

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

//create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.NODEMAILER_USER, // generated ethereal user
    pass: process.env.NODEMAILER_PASS, // generated ethereal password (FROM APP PASSWORD)
  },
});


//Send email using nodemailer
const sendEmail = async (emailAddress, emailData) => {
  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  const mailBody = {
    from: process.env.NODEMAILER_USER, // sender address
    to: emailAddress, // list of receivers
    subject: emailData.subject, // Subject line
    html: `<p>${emailData?.message}</p>`, // html body
  }
  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Email sent: " + info.response);
  });
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

    // verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.user?.email;
      const query = { email }
      const result = await userCollections.findOne(query);
      if (!result || result?.role !== 'admin') return res.status(403).send({ message: 'Forbidden Access! Admin Only' })
      next()
    }

    // verify Seller Middleware
    const verifySeller = async (req, res, next) => {
      const email = req.user?.email;
      const query = { email }
      const result = await userCollections.findOne(query);
      if (!result || result?.role !== 'seller') return res.status(403).send({ message: 'Forbidden Access! Seller Only' })
      next()
    }

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
    });

    //manage user status and role
    app.patch('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollections.findOne(query)
      if (!user || user?.status === 'Requested') {
        return res.status(400).send("Already requested")
      }
      const updateDoc = {
        $set: {
          status: "Requested"
        }
      }
      const result = await userCollections.updateOne(query, updateDoc)
      res.send(result)
    });

    //get all user data except logged admin user
    app.get('/all-users/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email: { $ne: email } }
      const result = await userCollections.find(query).toArray()
      res.send(result)
    });

    // update a user role & status
    app.patch(
      '/user/role/:email',
      verifyToken,
      async (req, res) => {
        const email = req.params.email
        const { role } = req.body
        const filter = { email }
        const updateDoc = {
          $set: { role, status: 'Verified' },
        }
        const result = await userCollections.updateOne(filter, updateDoc)
        res.send(result)
      }
    )


    //get user Role
    app.get('/users/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email;;
      const result = await userCollections.findOne({ email })
      res.send(result)
    })

    // get inventory data for seller
    app.get('/plants/seller', verifyToken, verifySeller, async (req, res) => {
      const email = req.user.email
      const result = await plantCollections
        .find({ 'seller.email': email })
        .toArray()
      res.send(result)
    })


    // Admin Statistics
    app.get('/admin-stat', verifyToken, async (req, res) => {
      const totalUsers = await userCollections.countDocuments();//slow|| can do filter
      const totalPlants = await plantCollections.estimatedDocumentCount();//fast
      // const allOrders = await ordersCollections.find().toArray();
      // const totalOrders = allOrders.length;
      // const totalPrice = allOrders.reduce((sum, order) => sum + order.price, 0)
      //get total Revenue, totla orders and total price
      const orderDetails = await ordersCollections.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalPrice: { $sum: '$price' }
          },
        },
        {
          $project: {
            _id: 0
          }
        }
      ]).next()

      // const myData = {
      //   date: '11/01/2025',
      //   quantity: 12,
      //   price: 1500,
      //   order: 3,
      // }
      // generate chart data
      const chartData = await ordersCollections
        .aggregate([
          { $sort: { _id: -1 } },
          {
            $addFields: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: '$_id' },
                },
              },
              quantity: {
                $sum: '$quantity',
              },
              price: { $sum: '$price' },
              order: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
              date: '$_id',
              quantity: 1,
              order: 1,
              price: 1,
            },
          },
        ])
        .toArray()
      res.send({ totalUsers, totalPlants, ...orderDetails, chartData })

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

    //customers Order
    app.get('/customer-orders/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'customer.email': email }

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
        //converting array to object
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

      res.send(result)
    });

    //get all orders for specific seller
    app.get('/seller-orders/:email', verifyToken, verifySeller, async (req, res) => {
      const email = req.params.email;
      const query = { seller: email }

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
        //converting array to object
        {
          $unwind: '$plants'
        },
        {
          $addFields: {
            name: '$plants.name',
          },
        },
        {
          $project: {
            plants: 0
          }
        }
      ]).toArray()

      res.send(result)
    });

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

    //save a plant data in db
    app.post('/plants', verifyToken, verifySeller, async (req, res) => {
      const plant = req.body;
      const result = await plantCollections.insertOne(plant)
      res.send(result);
    })


    //Post Orders
    app.post('/orders', async (req, res) => {
      const orderInfo = req.body;
      console.log(orderInfo)
      const result = await ordersCollections.insertOne(orderInfo)
      if (result.insertedId) {
        const emailData = {
          subject: 'Order Confirmation',
          message: `Your order has been placed successfully. Transaction ID: ${result.insertedId}`
        }
        sendEmail(orderInfo.customer.email, emailData)
        sendEmail(orderInfo.seller.email, {
          subject: 'New Order',
          message: `Get the plant ready for delivery to ${orderInfo.customer.name}`
        })
      };

      res.send(result);
    })

    // Update order Status
    app.patch(
      '/orders/:id',
      verifyToken,
      verifySeller,
      async (req, res) => {
        const id = req.params.id
        const { status } = req.body
        const filter = { _id: new ObjectId(id) }
        const updateDoc = {
          $set: { status },
        }
        const result = await ordersCollections.updateOne(filter, updateDoc)
        res.send(result)
      }
    )

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
      if (status === 'increase') {
        updateDoc = {
          $inc: {
            quantity: quantityToUpdate
          }
        }
      }
      const result = plantCollections.updateOne(filter, updateDoc);
      res.send(result)

    });

    //delete a plant from db
    app.delete('/plants/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await plantCollections.deleteOne(query)
      res.send(result)
    })

    //cancel or modify a order
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const order = await ordersCollections.findOne(query)
      if (order.status === 'Delivered') {
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
