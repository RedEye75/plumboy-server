const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

async function run() {
  try {
    // collection
    const serviceCollection = client.db("plumboy").collection("services");
    const feedbackCollection = client.db("plumboy").collection("feedback");

    // services api
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // review api
    app.get("/myFeedback", async (req, res) => {
      const query = {};
      const cursor = feedbackCollection.find(query);
      const myFeedback = await cursor.toArray();
      res.send(myFeedback);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await feedbackCollection.insertOne(review);
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
