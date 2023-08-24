const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


app.use( cors(
    { credentials: true, origin: true }
));

app.use(cookieparser());
app.use(express.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


/* *************************this is ownershcema***************************** */

const ul="mongodb://127.0.0.1/hotelroom";

mongoose.connect(ul, { useNewUrlParser: true , useUnifiedTopology: true,
});
cloudinary.config({
    cloud_name: 'dfah4llsg',
    api_key: '792516795792794',
    api_secret: 'ts1AuRy0KQYDdBNl_Zqy9Y6Rdm8',
  });
  

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    admin: Boolean
});
const Usermodel = mongoose.model("usermodel", userSchema);

const ownerschema = mongoose.Schema({
    key: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usermodel"
    },
    country: String,
    state: String,
    city: String,
    area: String,
    pincode: Number,
    price: Number,
    bedrooms: Number,
    maxguest: Number,
    roomtype: String,
    wifi: String,
    parking: String,
    roomsize: Number,
    img: String,
    img1: String,
    img2: String,
    currentbookings: Array,

});


const orderschema = mongoose.Schema({
    key: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usermodel"
    },
    fromdate: String,
    todate:String,
    roomid: String,
    img: String,
    country: String,
    state: String,
    city: String,
    area: String,
    pincode: Number,
    totaldays: Number,
    totalprice: Number
})

const OrderModel = mongoose.model("ordermodel", orderschema);





/*  ******************this is a user schema ******************************/





/* ************************this is a ownermodel **********************************/

const Ownerdata = mongoose.model("ownerdata", ownerschema);

/***********************this is a usermodel************************ */



/***********************************thsi is a image uploader sectioin***************************** */

/*const storage = multer.diskStorage({
    destination: '../frontend/src/imagescontainer',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname);
    }
});*/
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads',
    
      public_id: (req, file) => `image_${Date.now()}`,
    },
  });
  
const upload = multer({ storage: storage }).any();


/***********************************this is a post method for ownerregistration and home page**********************/











const verifytoken = (req, res, next) => {
    const tokenn = req.cookies.jsonwebtoken;
    if (!tokenn) {
        res.send({ message: "token is not found" });
    } else {
        jwt.verify(String(tokenn), "anujkumar", (err, data) => {
            if (err) {
                return res.json({ message: "invalid" })
            }
            req.id = data.id;
        });

        next();
    }
}


app.post("/ownerreg", upload, async (req, res) => {
    const token = req.cookies.jsonwebtoken;
    const verifytoken = jwt.verify(String(token), "anujkumar");
    console.log(verifytoken.id)

    const data = new Ownerdata({

        key: verifytoken.id,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        area: req.body.area,
        pincode: req.body.pincode,
        price: req.body.price,
        bedrooms: req.body.bedrooms,
        maxguest: req.body.maxguest,
        roomtype: req.body.roomtype,
        wifi: req.body.wifi,
        parking: req.body.parking,
        roomsize: req.body.roomsize,
        img: req.files[0] && req.files[0].path ? req.files[0].path : '',
        img1: req.files[1] && req.files[1].path ? req.files[1].path : '',
        img2: req.files[2] && req.files[2].path ? req.files[2].path : '',
    })
    await data.save();
    return res.send({ message: "Successfully posted",image:data });
})






app.get("/home", async (req, res) => {
    const data = await Ownerdata.find({})
    res.send(data);
})
app.get("/homename", async (req, res) => {
    const data = await Usermodel.find({})
    res.send(data);
})


app.get("/adminhome", verifytoken, async (req, res, next) => {
    const data = await Ownerdata.find({});
    res.send(data);
})

app.get("/adminhomename", verifytoken, async (req, res) => {

    const data = await Usermodel.find({})
    res.send(data);
})

app.get("/adminhomenamesingle", verifytoken, async (req, res) => {


})
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
app.get("/home/:id", async (req, res) => {
    const id = req.params.id;
    const d = await Ownerdata.findById(id);
    res.send(d);
})
app.post("/home/:id", async (req, res) => {
    const id = req.params.id;
    const d = await Ownerdata.findById(id);
    res.send(d);
})
app.get("/", verifytoken, function (req, res) {
    res.send("anuj kumar")
})



/********************************************* this is a post and get method for user data******************************* */

app.post("/signup", async (req, res) => {
    const { name, email, password, phone } = req.body;
    let finduser
    try {
        finduser = await Usermodel.findOne({ email: req.body.email })
    } catch (error) {
        console.log(error)
    }
    if (finduser) {
        return res.send({ message: "User already exist" })
    }
    const hashpassword = bcrypt.hashSync(password)
    const data = new Usermodel({
        name,
        email,
        phone,
        password: hashpassword,
        admin: false
    })
    await data.save()
    return res.send({ message: "Successfully created" })
})


app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let existinguser;
    try {
        existinguser = await Usermodel.findOne({ email: email })
    } catch (error) {
        console.log(error)
    }
    if (!existinguser) {
        return res.send({ message: "Email not exist" })
    }
    const ispasswordcorrect = bcrypt.compareSync(password, existinguser.password);
    if (!ispasswordcorrect) {
        return res.send({ message: "password not match" })
    }
    const token = jwt.sign({ id: existinguser._id }, "anujkumar", {
        expiresIn: "12000s",
    })

    res.cookie("jsonwebtoken", token, {
        expires: new Date(Date.now() + 1000 * 12000),
       
       
    })
    return res.send({ message: "Successfully login", data: existinguser, token })

})


app.get("/ownerreg", verifytoken, async (req, res) => {
    const userid = req.id;
    let user;
    try {
        user = await Usermodel.findById(userid, "-password");
    } catch (error) {
        return new Error(error)
    }
    if (!user) {
        return res.send({ message: "user not found" })
    }
    return res.send(user)
})

app.get("/postedroom", verifytoken, async (req, res) => {
    const token = req.cookies.jsonwebtoken;
    const verifytoken = jwt.verify(String(token), "anujkumar");
    const user = await Ownerdata.find({ key: verifytoken.id });
    if (!user) {
        return res.send({ message: "You have not posted yet" })
    }
    return res.send(user);
})


app.post("/orderbooked", async (req, res) => {
    const token = req.cookies.jsonwebtoken;
    const verifytoken = jwt.verify(String(token), "anujkumar");
    const { fromdate, todate, totaldays, order, totalprice } = req.body;
    const data = new OrderModel({
        key: verifytoken.id,
        fromdate,
        todate,
        roomid: order._id,
        img: order.img,
        country: order.country,
        state: order.state,
        city: order.city,
        area: order.area,
        pincode: order.pincode,
        totaldays,
        totalprice
    })
    const booking = await data.save();
   console.log(booking.key)
    const roomtemp = await Ownerdata.findOne({ _id: order._id });
    
    roomtemp.currentbookings.push({ bookingid: booking._id , fromdate: fromdate, todate: todate ,userid: booking.key})
    console.log(roomtemp.currentbookings)
    await roomtemp.save();
    return res.send({ message: "Successfully Booked" });
})


app.get("/orderbooked", verifytoken, async (req, res) => {
    const token = req.cookies.jsonwebtoken;
    const verifytoken = jwt.verify(String(token), "anujkumar");
    console.log(verifytoken.id)
    const user = await OrderModel.find({ key: verifytoken.id });
    if (!user) {
        return res.send({ message: "You have not booked yet" })
    }
    return res.send(user)
})

app.get("/orderbookedadmin", async (req, res) => {
    const user = await OrderModel.find({});
    if (!user) {
        return res.send({ message: "You have not booked yet" })
    }
    return res.send(user)
})
const port=process.env.PORT || 4000;
app.listen(4000, async () => {
    console.log("the server is running on port 4000")
})