import mongoose, { mongo } from "mongoose"

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
    required: [true, "password is required"]
  }
}, {timestamps: true});

const accountSchema = new mongoose.Schema({
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  balance:{
    type: Number,
    require: true,
    default: 0
  }
})

export const User = mongoose.model("User", userSchema);
export const Account = mongoose.model("Account", accountSchema);