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

//verify jwt midlware

const verifyToken = (req,res,next)=>{
  const token = req.cookies?.token;
  if(!token) {
      return res.status(401).send({message:"Unauthorized Access"})
  }
  if(token){
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
          if(err){
              console.log(err);
              return res.status(403).send({message:"Forbidden Access"})
              
          }
          console.log(decoded);
          req.user= decoded;
          next();
      })
  }
  
}


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

    //  await client.connect();
    
    const foodsCollection = client.db('foodsDB').collection('foodItem');
    const foodsRequestCollection = client.db('foodsDB').collection('foodReq');

    // jwt generator
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'365d',       
      })
      res.cookie('token',token,{
        httpOnly:true,
        secure:process.env.NODE_ENV === 'production',
        sameSite:process.env.NODE_ENV === 'production' ? 'none':'strict'

      }).send({success:true})
    })

    //clear token

    app.get('/logout',(req,res)=>{
      res.clearCookie('token',{
          httpOnly:true,
          secure:process.env.NODE_ENV==='production',
          sameSite:process.env.NODE_ENV === 'production' ?'none':'strict',
          maxAge:0
      }).send({success:true})
  })
    // get all available food data

    app.get('/foods',async(req,res)=>{
        // const order = req.query.quantity;
        const result = await foodsCollection.find().sort({foodQuantity:-1}).toArray();
        res.send(result);
    })

    //get single food
    app.get('/food/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)};
        const result = await foodsCollection.findOne(query);
        res.send(result);
    })

    // save a food collection to database by post

    app.post('/food',verifyToken,async(req,res)=>{
        const foodData = req.body;
        const result = await foodsCollection.insertOne(foodData);
        res.send(result);
    })

    //my foods get by email
    
    app.get('/foods/:email',verifyToken,async(req,res)=>{
        const email = req.params.email;
        const tokenEmail = req.user.email;
        console.log(tokenEmail,email);
        if(tokenEmail!==email){
            return res.status(403).send({message:"Forbidden Access"})
        }
        const query = {'donatorEmail':email};
        const result = await foodsCollection.find(query).toArray();
        console.log(email,tokenEmail,"from manage my food food");
        res.send(result);
    })
    
    // upate single food item

    
    app.put('/food/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const foodData = req.body;
      const options = {upsert:true};
      const updateDoc = {
          $set:{
              ...foodData,
          }
      }
      const result = await foodsCollection.updateOne(query,updateDoc,options);
      res.send(result);
  })

  // delete my single foods
  app.delete('/food/:id',verifyToken,async(req,res)=>{
    const id = req.params.id;
    console.log(id);
    const query = {_id:new ObjectId(id)};
    const result = await foodsCollection.deleteOne(query);
    res.send(result);
})

// get foodRequest data
  app.get('/foodsReq',async(req,res)=>{
    
    const result = await foodsRequestCollection.find().toArray();
    res.send(result);
  })

//save foodRequest data by post 
  app.post('/foodReq',async(req,res)=>{
    const foodReq = req.body;
    const result = await foodsRequestCollection.insertOne(foodReq);
    res.send(result);
  })

  // my food req get 
  app.get('/foodsReq/:email',verifyToken,async(req,res)=>{
    const email = req.params.email;
   
        const tokenEmail = req.user.email;
        console.log(tokenEmail,email);
        if(tokenEmail!==email){
            return res.status(403).send({message:"Forbidden Access"})
        }
    const query = {'loggedEmail':email};
    const result = await foodsRequestCollection.find(query).toArray();
    console.log(email,tokenEmail,"from request food");
    res.send(result);
})

// total data count for pagination
app.get('/all-foods',async(req,res)=>{
  const size = parseInt(req.query.size);
  const page = parseInt(req.query.page)-1;
  const sort = req.query.sort;
  const search = req.query.search;

  let query = {
    foodName : {$regex: search, $options:'i'},
  }

  const result = await foodsCollection.find(query).sort({deadline: sort==='dsc' ? -1 : 1}).skip(page*size).limit(size).toArray();
  
  res.send(result);
})

//data count
app.get('/foods-count',async(req,res)=>{
  const search = req.query.search;

  let query = {
    foodName : {$regex: search, $options:'i'},
  }

  const count = await foodsCollection.countDocuments(query);
  res.send({count});
 
})




    






   
    // await client.db("admin").command({ ping: 1 });
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