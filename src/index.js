require('dotenv').config()
const mongoose =require('mongoose')
const morgan =require('morgan')
const sanpham = require('../model/sanpham')
const transaction = require('../model/transaction')
const {Web3}  = require('web3');
const Daugia = require('./contracts/Daugiacontract.json')


const http = require('http');
const express = require('express');
const app = express();
const socketIo = require('socket.io');
const cors = require('cors')

app.use(cors())


const server = http.createServer(app);
const io = socketIo(server, {
  cors:{
    origin:"*"
  },
});
const port= process.env.PORT

const uri=process.env.MONGO_URI

//khai bao web3
const web3 = new Web3 (new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545'))
const contractAddress = '0xF3b4B2fa2546049bF9D15eCAC6BCAf2b87D254a9'



// Tạo một instance của hợp đồng từ ABI và địa chỉ
const contractInstance = new web3.eth.Contract(Daugia.abi, contractAddress);


app.use(morgan('combined'))

app.use(express.json());

app.use(express.urlencoded())

app.use(cors());

io.on('connection', (socket) => {
  console.log('abc');
  socket.on("test_emit", (data) => {
    console.log('Message from client:', data);
  });
});

const eventupdateHighestBid = contractInstance.events.updateHighestBid();
const eventsessionWinner=contractInstance.events.sessionWinner();

eventupdateHighestBid.on('data', function(event){
  io.emit('update-highestbid',{bid: event.returnValues.bid.toString(),bidder:event.returnValues.bidder})

});

eventsessionWinner.on('data', function(event){
  io.emit('session-end' ,{amount: event.returnValues.bid.toString() , winner: event.returnValues.winner})
});

app.get("/highestbid",async (req,res)=>{
  try{
    const highestbid= await contractInstance.methods.highestBid().call()
    res.status(200).json(highestbid.toString())
  } catch(error){
    res.status(500).json({ error: error.message });
  }
})

app.get("/getWinner",async (req,res)=>{
  try{
    const { From } = req.body;
    try{
      await contractInstance.methods.sessionEnd().call({
        from: From,
      })
      const end=  await contractInstance.methods.ended().call()
      const highestbid= await contractInstance.methods.highestBid().call()
      const highestBidder= await contractInstance.methods.highestBidder().call()
      res.status(200).json({end:end, highestbid:highestbid.toString(),highestBidder:highestBidder})
    }
    catch(e){
      const end= await contractInstance.methods.ended().call()
      const highestbid= await contractInstance.methods.highestBid().call()
      const highestBidder= await contractInstance.methods.highestBidder().call()
      res.status(200).json({end:end, highestbid:highestbid.toString(),highestBidder:highestBidder})
    }
  } catch(error){
    res.status(500).json({ error: error.message });
  }
})


contractInstance.methods.highestBid().call().toString()
app.get("/12", async (req, res) => {
  try {
    const sp = await sanpham.find({});
    console.log("aaa");
    res.status(200).json({
      message:"OKELA",
      data:sp
    }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/posttrans", async (req, res) => {
  try {
    const { From, To, Gasused, Value, Transactionhash } = req.body;
    const newTransaction = new transaction({
      From: From,
      To: To,
      Gasused: Gasused,
      Value: Value,
      TransactionHash: Transactionhash
    });
    await newTransaction.save();
    res.status(200).json({ message: "OK" });
  }catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/getTransbyID", async (req, res) => {
  try {
    const address =req.query.Address;
    const transs = await transaction.find({
      $or: [
        { From: address.toLowerCase() },
        { To: address.toLowerCase() }
    ]
               
    });
  const transhashs = transs.map(transaction => transaction.TransactionHash);
    res.status(200).json({
      message:"OKELA",
      return:transhashs
    }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/daugia", async (req, res) => {

  try {
    const { From,  Value} = req.body;
    returns= await contractInstance.methods.bid().call({
      from: From,
      value: web3.utils.toWei(Value,'ether')
    })

    const result= await contractInstance.methods.bid().send({
      from: From,
      value: web3.utils.toWei(Value,'ether')
    })
    
    res.status(200).json({ message: "OK", data: result.transactionHash});
  }catch (e) {
    // const data = e.data;
    // const txHash = Object.keys(data)[0]; // TODO improve
    // const reason = data[txHash].reason;
    // console.log(reason);
    res.status(500).json({ message: e.message });
  }
  
});

app.post("/rutve", async (req, res) => {
  try {
    const { From } = req.body;
    const returns= await contractInstance.methods.withdraw().call({
      from: From,
    })
    const result= await contractInstance.methods.withdraw().send({
      from: From,
    })
    console.log(result);
    res.status(200).json({ message: "OK", data: result.transactionHash ,return: returns});
  }catch (error) {
    res.status(500).json({ message: error.message });
  }


});

app.post("/ketthucphien", async (req, res) => {
  try {
    const { From } = req.body;
    const result= await contractInstance.methods.sessionEnd().send({  
      from: From,
    })
    console.log(result);
    res.status(200).json({ message: "OK", data: result.transactionHash });
  }catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

mongoose.connect(uri)
  .then(()=>{
    server.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
    
  })
  .catch((error)=>{
    console.log(error)
  })

