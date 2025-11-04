import User from "../models/userSchema.js";
import Meeting from "../models/meetingModel.js";
import httpStatus from "http-status";
import bcrypt , {hash} from "bcrypt";
import jwt from "jsonwebtoken";

const signup = async (req, res) => {

    const {name , username , password } = req.body
    if (!name || !username || !password ){
        return res.status(httpStatus.BAD_REQUEST).json({message: "user data is missing"})
    }

    try {
        const existingUser = await User.findOne({username})
        if(existingUser) {
            return res.status(httpStatus.CONFLICT).json({message: "user already exists"})
        }
        const hashedPassword = await bcrypt.hash(password , 10)
        const newUser = new User ({
            name: name,
            username: username,
            password: hashedPassword
        });
        await newUser.save();
        res.status(httpStatus.CREATED).json({message: "user created successfully"})

    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `something went wrong : ${error.message}`})
    }

}


const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "User data is missing" });
  }

  try {
    const user = await User.findOne({ username });
    console.log(user);

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid password" });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE } // e.g. "1d"
    );

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });

  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${error.message}` });
  }
};

const getMe = async (req, res) => {
    try {
        // The 'protect' middleware has already found the user and attached it to req.user
        // We just need to send it back.
        const user = req.user;

        res.status(httpStatus.OK).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
            },
        });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${error.message}` });
    }
};

const getUserHistory = async (req, res) => {
  console.log("called");
  const token = req.query.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
    }
    const meetings = await Meeting.find({ user_id: user.username });
    console.log(meetings);
    return res.json(meetings);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `something went wrong ${error}` });
  }
}

const addToHistory = async (req, res) => {
  
  const {token , meetingCode} = req.body
  if(meetingCode){
    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ username: decoded.username });
    console.log(user)
    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meetingCode,
    })
    await newMeeting.save()
    return res.status(httpStatus.CREATED).json({message: "added code to history"})

  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `something went wrong ${error}`})
    console.log(error)
  }
  } else {
    return res.status(httpStatus.BAD_REQUEST).json({message: "no meeting code provided"})
  }
  
}

export {signup , login ,getMe , getUserHistory, addToHistory} ;