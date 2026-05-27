import mongoose from "mongoose"

export const connect = async ()=> {
  try {
    const connect = await mongoose.connect(process.env.DB_URL)
    console.log(`MongoDB connected !! HOST is ${connect.connection.host}`);
  } catch (error) {
    console.log("error while connecting ", error);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, "cannot be blank"], 
    minlength: 3, 
    maxlength: 50,
    lowercase: true,
    unique: true,
    trim: true,
    match: [/^[a-zA-Z0-9]+$/, 'is invalid']
  },
  firstName : {
    type: String,
    required: true,
    maxlength: 20,
  },
  lastName: {
    type: String,
    required: true,
    maxlength: 20
  },
  password: {
    type: String,
    required: [true, "password is required"],
    maxlength: 30,
    minlength: 8,
  }
}, {timestamps: true});

export const User = mongoose.model("User", userSchema);