const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const {
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const multer = require("multer");

const User = require("../models/User");

const redisClient = require("../config/redis");
const storage = require("../config/firebase");

const upload = multer({ storage: multer.memoryStorage() });

// helper functions
const giveCurrentDateTime = () => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date + " " + time;
  return dateTime;
};

// for redis testing (Will be removed later)
exports.getSessionData = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const sessionData = await redisClient.get(`session:${userId}`);
    if (!sessionData)
      return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ sessionData });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

// Authentication and Authorization Controllers
exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ messages: errors.array() });

    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const userToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    redisClient.setEx(`session:${newUser._id}`, 86400, userToken);

    res.cookie("userJWT", userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      signed: true,
    });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ messages: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid Credentials" });

    res.clearCookie("userJWT", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      signed: true,
    });

    const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log("userToken: ", userToken);

    res.cookie("userJWT", userToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      signed: true,
    });

    return res.status(201).json({ message: "User logged in successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.signedCookies.userJWT;
    if (!token) return res.status(401).json({ message: "Not Authorized" });

    res.clearCookie("userJWT", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
      signed: true,
    });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Dashbaord Controllers
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

exports.updateUserInformation = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      phoneNumber,
      address,
      linkedIn,
      github,
      instagram,
      education,
      experience,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (linkedIn) user.socialMedia.linkedIn = linkedIn;
    if (github) user.socialMedia.github = github;
    if (instagram) user.socialMedia.instagram = instagram;

    if (education) user.education = education;
    if (experience) user.experience = experience;

    await user.save();
    res
      .status(200)
      .json({ message: "Personal Info updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", err });
  }
};

// Will be done in firebase!
exports.uploadImage = [
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const dateTime = giveCurrentDateTime();
      const storageRef = ref(
        storage,
        `images/${req.file.originalname + " " + dateTime}`
      );
      const metadata = {
        contentType: req.file.mimetype,
      };
      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata
      );
      const downloadURL = await getDownloadURL(snapshot.ref);

      user.profilePicture = downloadURL;
      await user.save();

      return res
        .status(200)
        .json({ message: "Image uploaded successfully", url: downloadURL });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
];
