import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();
app.use(cors())
app.use(express.json({limit:  '50mb'}))
app.use(express.urlencoded({limit: '50mb', extended: true}))
app.use(express.static('public'))
app.use(cookieParser())

//importing routes
import userRouter from './routes/user.route.js'

//creating routes
app.use('/api/v1/user', userRouter);
export {app}

