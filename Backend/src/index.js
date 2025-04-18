import dotenv from 'dotenv';
import connectDB from './db/connectDB.js';
import {app} from './app.js';
dotenv.config();

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