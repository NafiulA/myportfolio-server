const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfvk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {
        await client.connect();

        const database = client.db("nafiulalam");
        const userCollection = database.collection("users");
        const reviewCollection = database.collection("reviews");
        const projectCollection = database.collection("projects");

        app.put("/user", async (req, res) => {
            const body = req.body;
            const email = body.email;
            const query = { email: email };
            const options = { upsert: true };
            const doc = {
                $set: body
            }
            const result = await userCollection.updateOne(query, doc, options);

            const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET)

            res.send({ result, accessToken });
        });

        app.post("/reviews", verifyJWT, async (req, res) => {
            const body = req.body;
            const result = await reviewCollection.insertOne(body);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("server running");
});

app.listen(port, () => {
    console.log("listening to", port);
});
