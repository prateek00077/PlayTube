import dotenv from 'dotenv';
import connectDB from './db/connectDB.js';
dotenv.config();

connectDB()
.then(()=>{
    console.log('Database connected successfully');
})
.catch((error)=>{
    console.error('Database connection failed:', error);
    process.exit(1);
})