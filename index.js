const express = require('express');
const mongoose  = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
const ecomRoute = require("./routes/ecom");

app.use(ecomRoute);

// connect to mongoDB
const dbUser=process.env.DB_USERNAME;
const dbPass=process.env.DB_PASSWORD;


mongoose.connect("mongodb+srv://"+`${dbUser}`+":"+`${dbPass}`+"@cluster0.u68qefn.mongodb.net/product", 
                  { useNewUrlParser: true, useUnifiedTopology: true});                  



app.listen(PORT, () =>{
    console.log('Server started at port 3000');
})