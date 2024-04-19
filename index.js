const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

//Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xlp2yoh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const appointmentOptionCollection = client
      .db("doctorPortal")
      .collection("appointmentOptions");

    const bookingsCollection = client.db("doctorPortal").collection("bookings");


    // Use Aggregate to query multiple collection and then merge data
    // app.get("/appointmentOptions", async (req, res) => {
    //   const date = req.query.date;
    //   const query = {};
    //   const options = await appointmentOptionCollection.find(query).toArray();

    //   // get the bookings of the provided date
    //   const bookingQuery = { appointmentDate: date };
    //   const alreadyBooked = await bookingsCollection
    //     .find(bookingQuery)
    //     .toArray();

    //   // code carefully :D
    //   options.map((option) => {
    //     const optionBooked = alreadyBooked.filter(
    //       (book) => book.treatment === option.name
    //     );
    //     const bookedSlots = optionBooked.map((book) => book.slot);
    //     const remainingSlots = option.slots.filter(
    //       (slot) => !bookedSlots.includes(slot)
    //     );
    //     option.slots = remainingSlots;
    //   });
    //   res.send(options);
    // });

    app.get("/appointmentOptions", async (req, res) => {
      try {
        const date = req.query.date;
        const query = {};
        const options = await appointmentOptionCollection.find(query).toArray();
    
        // get the bookings of the provided date
        const bookingQuery = { appointmentDate: date };
        const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
    
        // Loop through each option and filter out the booked slots
        const updatedOptions = options.map(option => {
          const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
          const bookedSlots = optionBooked.map(book => book.slot);
          const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
          console.log(remainingSlots.length);
          return { ...option, slots: remainingSlots };

        });
    
        res.send(updatedOptions);
      } catch (error) {
        console.error("Error fetching appointment options:", error);
        res.status(500).send("Internal Server Error");
      }
    });
    

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      booking.timestamp = new Date().getTime();
      const cursor = await bookingsCollection.insertOne(booking);
      res.send(cursor);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`This server is running on ${port}`);
});

app.listen(port, () =>
  console.log("Doctor Portal server is Running Perfectly.")
);
