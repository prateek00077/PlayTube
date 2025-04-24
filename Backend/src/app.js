import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.route.js'
import dotenv from 'dotenv';
import connectDB from './db/connectDB.js';

dotenv.config();
const app = express();
app.use(cors())
app.use(express.json({limit:  '50mb'}))
app.use(express.urlencoded({limit: '50mb', extended: true}))
app.use(express.static('public'))
app.use(cookieParser())

//creating routes
app.use('/api/v1/user', userRouter);

connectDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    console.log('Database connected successfully');
})
.catch((error)=>{
    console.error('Database connection failed:', error);
    process.exit(1);
})




