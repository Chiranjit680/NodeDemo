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

// User Schema
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

// Middleware for login check
const userMiddleware = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({ name: username, password: password });

    if (user) next();
    else return res.status(403).json({ message: "Invalid Credentials" });
};


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


// Protected Route - Get All Users
app.get('/users', userMiddleware, async (req, res) => {
    const token = req.headers.authorization;

    try {
        const decoded = jwt.verify(token, JWT_KEY);
        const username = decoded.name;

        const allUsers = await User.find();  // MongoDB Fetch
        res.json(allUsers);  // Send users
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid Token" });
    }
});
// Signin Route
app.post('/signin', userMiddleware, (req, res) => {
    const token = jwt.sign({ username: req.body.username }, JWT_KEY);
    res.json({
        message: "Signin successful",
        token: token
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
