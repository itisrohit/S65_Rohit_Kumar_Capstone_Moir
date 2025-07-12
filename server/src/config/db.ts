import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB is connected at ${mongoose.connection.host}`)
    } catch (error: any) {
        console.error("Error:", error.message);
        process.exit(1)
    }
}

export { connectDB }