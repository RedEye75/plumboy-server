const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 7000;

// -------------------------***middlewires***-------------------------
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.petbnp7.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// jwt verification
function JWTVerify(req, res, next) {
  const authHeader = req.header.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
    if (error) {
      res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    // collection
    const serviceCollection = client.db("plumboy").collection("services");
    const feedbackCollection = client.db("plumboy").collection("feedback");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });
    // services api
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/limitServices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    app.post("/serviceAdd", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // review api
    app.get("/myFeedback", JWTVerify, async (req, res) => {
      // console.log(req.headers.authorization);
      const decoded = req.decoded;
      console.log(decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = feedbackCollection.find(query);
      const myFeedback = await cursor.toArray();
      res.send(myFeedback);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await feedbackCollection.insertOne(review);
      res.send(result);
    });

    // update
    app.patch("/myFeedback/:id", JWTVerify, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await feedbackCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete
    app.delete("/myFeedback/:id", JWTVerify, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await feedbackCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.error(error));

app.get("/", (req, res) => {
  res.send("plumboy is running");
});
app.listen(port, () => {
  console.log(`plumboy ruunning on ${port}`);
});
