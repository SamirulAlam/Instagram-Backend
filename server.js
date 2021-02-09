import express from 'express';
import mongoose from 'mongoose';
import Cors from 'cors';
import Pusher from 'pusher';
import dbModel from './dbModel.js';
import dotenv from 'dotenv';
dotenv.config();

//app config
const app = express();
const port = process.env.Port || 8080;
const secret = process.env.SECRET_KEY;
const pusher = new Pusher({
    appId: "1153291",
    key: "34874447bdbad0e0f1bf",
    secret: secret,
    cluster: "ap2",
    useTLS: true
  });
//middleware
app.use(express.json());
app.use(Cors());
//DB config
const password = process.env.PASSWORD;
const connection_url=`mongodb+srv://admin:${password}@cluster0.nwtnr.mongodb.net/instadb?retryWrites=true&w=majority`;
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

mongoose.connection.once("open",()=>{
    console.log("DB Connected");
    const changeStream=mongoose.connection.collection("posts").watch();
    changeStream.on("change",(change)=>{
        console.log("Change Triggered on pusher");
        console.log(change);
        console.log("End of Change");

        if(change.operationType==="insert"){
            console.log("Triggering Pusher ***IMG UPLOAD***");
            const postDetails=change.fullDocument;
            pusher.trigger("posts","inserted",{
                user:postDetails.user,
                caption:postDetails.caption,
                image:postDetails.image
            })
        }else{
            console.log("Unknown trigger from pusher")
        }
    })
})
//api config
app.get("/",(req,res) => {res.status(200).send("instagram")});

app.get("/sync",(req,res) => {
    dbModel.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

app.post("/upload",(req,res)=>{
    const body=req.body;
    dbModel.create(body,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    })
})
//listen
app.listen(port,()=>console.log(`listening to port ${port}`));