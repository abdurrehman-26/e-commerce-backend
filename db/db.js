import 'dotenv/config'
import mongoose from "mongoose";

const connectdb = async () => {
    try {
        const connectioninstance = await mongoose.connect(`${process.env.DATABASE_URI}`);
        console.log(`MongoDB connected !! DB host: ${connectioninstance.connection.host}`)
    } catch (error) {
        console.log(`Mongodb connection falied. Error: ${error}`)
        process.exit(0)
    }
}

export default connectdb