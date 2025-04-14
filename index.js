const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

const JWT_KEY = "unhashit1234@2025";

// MongoDB Connection
mongoose.connect("mongodb+srv://chiranjit680:unlockit@cluster0.zx3ya.mongodb.net/user_app?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB Error: ", err));

app.use(express.json());

// User Schema................................................
const user_schema=mongoose.Schema({
    name: String,
    email: String,
    password: String,
    admin: Boolean, 
    purchased:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Course'
    }]

},{timestamps:true})
const courseschema=mongoose.Schema({
    name:String,
    domain:String,
    rating:
    {
        type: Number,
        default: 0
    },

    boughtby:{
        type: Number,
        default: 0
    }

},{timestamps:true})

const purchaseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course' },
    transaction_id: String
}, { timestamps: true });

const Purchase = mongoose.model('Purchase', purchaseSchema);
const User = mongoose.model('User', user_schema);
const Course=mongoose.model('Course', courseschema)

// Middleware for login check...........................
const userMiddleware = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({ name: username, password: password });

    if (user) next();
    else return res.status(403).json({ message: "Invalid Credentials" });
};


const jwtMiddleWare= async (req, res, next)=> {
    token = req.headers.authorization;
    try{
        const decoded = jwt.verify(token, JWT_KEY);

    }
    catch(err)
    {
        return res.status(403).send("Invalid token");
    }
    next()

}
//.........................................................................
// Signup API
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ name: username });
    if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
    }

    const user = new User({
        name: username,
        email: email,
        password: password,
        admin: false
    });

    await user.save();

    const token = jwt.sign({ name: username }, JWT_KEY);
    res.json({ message: "User created successfully!", token: token });
});


// Signin Route
app.post('/signin', userMiddleware, (req, res) => {
    const token = jwt.sign({ username: req.body.username }, JWT_KEY);
    res.json({
        message: "Signin successful",
        token: token
    });
});


// Protected Route - Get All Users
app.get('/users', jwtMiddleWare,async (req, res) => {
    const token = req.headers.authorization;

   
    const allUsers = await User.find();  // MongoDB Fetch
    res.json(allUsers);  // Send users
});

//api to view a course ....................
app.get('/courses/view', jwtMiddleWare, async (req, res )=>
{
     course_name=req.query.crs;
     course= await Course.findOne({name: course_name});
     res.json(course);

} )



//api to purchase a course..................
app.post('/courses/purchase', jwtMiddleWare, async (req,res)=>
{
    token=req.headers.authorization;
    course_name=req.body.course;
    course=await Course.findOne({name:course_name});
    if(!course) res.status(404).send("Bad request, course not found");
    username=jwt.verify(token, JWT_KEY).username;
    user = await User.findOne({name: username});
    
    course.boughtby++;
   await course.save();
    user.purchased.push(course);
   await user.save();
   const newPurchase = new Purchase({
    course: course._id,
    user: user._id,
    transaction_id: Math.random().toString(36).substring(2, 12) // simple random id
});
await newPurchase.save();

res.json({
    message: "Course purchased successfully!",
    transaction_id: newPurchase.transaction_id
});


})



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
