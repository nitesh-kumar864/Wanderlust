const mongoose = require("mongoose");
const axios = require("axios");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
require("dotenv").config({ path: "../.env" });

const dbURL = process.env.MONGODB_URL;

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

async function main() {
   await mongoose.connect(`${dbURL}/wanderlust`);
}


const initDB = async () => {
  await Listing.deleteMany({});
  console.log("Old listings removed");

  for (let item of initData.data) {
  try {
    const geoRes = await axios.get("https://us1.locationiq.com/v1/search.php", {
      params: {
        key: process.env.LOCATION_IQ_TOKEN,
        q: `${item.location}, ${item.country}`,
        format: "json",
      },
    });

    const lat = geoRes.data[0].lat;
    const lng = geoRes.data[0].lon;

    const newListing = new Listing({
      ...item,
      category: assignCategory(item),
      owner: "6931ab4c0e33355275177b73",
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });

    await newListing.save();
    console.log(`Saved: ${item.title}`);
  } catch (err) {
    console.log(`Error for ${item.title} → ${err.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
}
  console.log("All Listings Inserted with Coordinates!");
  mongoose.connection.close();
};

initDB();
