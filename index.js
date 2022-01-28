const express = require('express')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eeauc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri);



async function run() {
    try {
      await client.connect();
      const database = client.db('user_experiance');
      const blogCollection = database.collection('blogs');
      const usersCollection = database.collection('users')

      app.get('/blogs', async(req,res) => {
          const page = parseInt(req.query['page'])
          console.log(page)
          const skips = 10 * (page - 1)
          const cursor =  blogCollection.find({}).skip(skips).limit(10)
          const blogs = await cursor.toArray();
          res.send(blogs)
      })

      app.get('/blogsUnApproved', async(req,res) => {
        const cursor =  blogCollection.find({})
        const blogs = await cursor.toArray();
        res.send(blogs)
    })

      app.get('/blogsCount', async(req,res) => {
        const cursor =  blogCollection.find({})
        const blogs = await cursor.toArray();
        res.send({count: blogs.length})
    })

      //get single services
      app.get('/blogs/:id', async(req,res) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const blog = await blogCollection.findOne(query);
        res.json(blog)
    }) 

    //post api
    app.post('/blogs',async(req,res) =>{
        const blog = req.body;
        console.log('hit the api', blog);

        const result = await blogCollection.insertOne(blog)
        // console.log(result);
        res.json(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user)
      console.log(result);
      res.json(result)
  })

  app.put('/users', async (req, res) => {
    const user = req.body
    console.log('put', user);
    const filter = { email: user.email };
    const options = {upsert:true}

    const updateDoc = { $set: user}
    const result = await usersCollection.updateOne(filter, updateDoc, options)
    res.json(result)
})

app.put('/users/admin', async (req, res) => {
  const user = req.body
  console.log('put', user);
  const filter = { email: user.email }
  const updateDoc = { $set: { role: 'admin' } }
  const result = await usersCollection.updateOne(filter, updateDoc)
  res.json(result)
})

app.put('/approveBlog/:id', async (req, res) => {
  const filter = { _id: ObjectId(req.params.id) }
  const updateDoc = { $set: { isApproved: true } }
  const result = await blogCollection.updateOne(filter, updateDoc)
  res.json(result)
})

app.get('/users/:email', async (req, res) => {
  const email = req.params.email
  const query = { email: email }
  const user = await usersCollection.findOne(query)
  let isAdmin = false;
  if (user?.role === 'admin') {
      isAdmin = true;
  }
  res.json({ admin: isAdmin })
})

    } 
    finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log('Example app listening on on port', port)
})