const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();



const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const corsOptions = {
    origin:['http://localhost:5173','https://tasty-bites-auth.web.app'],
    credentials:true,
    optionSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ib4xmsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

     await client.connect();
    
    const foodsCollection = client.db('foodsDB').collection('foodItem');

    // get all available food data

    app.get('/foods',async(req,res)=>{
        const result = await foodsCollection.find().toArray();
        res.send(result);
    })
    app.get('/food/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)};
        const result = await foodsCollection.findOne(query);
        res.send(result);
    })

    // save a food collection to database

    app.post('/food',async(req,res)=>{
        const foodData = req.body;
        const result = await foodsCollection.insertOne(foodData);
        res.send(result);
    })

    //my foods get by email
    
    app.get('/foods/:email',async(req,res)=>{
        const email = req.params.email;
        const query = {'donatorEmail':email};
        const result = await foodsCollection.find(query).toArray();
        res.send(result);
    })


    






   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/',(req,res)=>{
    res.send("Server is running")
})

app.listen(port,()=>{
    console.log(`Server is runnon port : ${port}`);
})