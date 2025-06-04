const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

console.log("Connecting to MongoDB...")

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/auberge-amazigh", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// SCHEMAS & MODELS
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const roomSchema = new mongoose.Schema({
  label: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [String],
  isOccupied: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const bookingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  roomName: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true },
  specialRequests: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"],
    default: "pending",
  },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})

const Admin = mongoose.model("Admin", adminSchema)
const Room = mongoose.model("Room", roomSchema)
const Booking = mongoose.model("Booking", bookingSchema)

// UPLOADS DIRECTORY SETUP
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("Created uploads directory")
}

// MULTER CONFIG FOR FILE UPLOADS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    cb(null, `room-${uniqueSuffix}${extension}`)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir))

// AUTH MIDDLEWARE
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." })

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    req.admin = decoded
    next()
  } catch (error) {
    res.status(400).json({ message: "Invalid token." })
  }
}

// INIT ADMIN
const initializeAdmin = async () => {
  try {
    const existing = await Admin.findOne({ username: "admin" })
    if (!existing) {
      const hashed = await bcrypt.hash("admin123", 10)
      await new Admin({ username: "admin", password: hashed }).save()
      console.log("Default admin created: username: admin, password: admin123")
    }
  } catch (err) {
    console.error("Error initializing admin:", err)
  }
}

// INIT ROOMS
const initializeRooms = async () => {
  try {
    const count = await Room.countDocuments()
    if (count === 0) {
      const defaultRooms = [
        { label: "Masmouda", description: "A cozy room with traditional decor.", price: 60 },
        { label: "Sanhaja", description: "Spacious room perfect for couples.", price: 75 },
        { label: "Ait Sadden", description: "Modern amenities with a traditional touch.", price: 80 },
        { label: "Ait Youssi", description: "Great for families and groups.", price: 95 },
        { label: "Ait Ayoub", description: "Peaceful room with garden view.", price: 70 },
        { label: "Allal El Fassi", description: "Elegant design and comfort.", price: 85 },
        { label: "Ait Ali", description: "Top-tier room with best amenities.", price: 100 },
      ]
      await Room.insertMany(defaultRooms)
      console.log("Default rooms created")
    }
  } catch (err) {
    console.error("Error initializing rooms:", err)
  }
}

// ROUTES

// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const admin = await Admin.findOne({ username })
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "24h",
    })

    res.json({ token, message: "Login successful" })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// IMAGE UPLOAD ROUTE
app.post("/api/admin/upload", authenticateAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err)
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    console.log("File uploaded:", req.file.filename)

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    })
  })
})

// Admin Bookings
app.get("/api/admin/bookings", authenticateAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

app.patch("/api/admin/bookings/:id", authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (!booking) return res.status(404).json({ message: "Booking not found" })

    if (status === "checked-in") await Room.findByIdAndUpdate(booking.roomId, { isOccupied: true })
    else if (["checked-out", "cancelled"].includes(status))
      await Room.findByIdAndUpdate(booking.roomId, { isOccupied: false })

    res.json(booking)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Admin Rooms
app.get("/api/admin/rooms", authenticateAdmin, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 })
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

app.post("/api/admin/rooms", authenticateAdmin, async (req, res) => {
  try {
    const { label, description, price, images } = req.body
    const room = new Room({ label, description, price: Number(price), images: images || [] })
    await room.save()
    res.status(201).json(room)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

app.put("/api/admin/rooms/:id", authenticateAdmin, async (req, res) => {
  try {
    const { label, description, price, images } = req.body
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { label, description, price: Number(price), images },
      { new: true },
    )

    if (!room) return res.status(404).json({ message: "Room not found" })
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

app.delete("/api/admin/rooms/:id", authenticateAdmin, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id)
    if (!room) return res.status(404).json({ message: "Room not found" })

    // Delete associated image files
    if (room.images && room.images.length > 0) {
      room.images.forEach((filename) => {
        const filePath = path.join(uploadsDir, filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted image file: ${filename}`)
        }
      })
    }

    res.json({ message: "Room deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Public routes
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find()

    // Add full URLs to images
    const roomsWithImageUrls = rooms.map((room) => {
      const roomObj = room.toObject()
      roomObj.images = roomObj.images.map((img) => `${req.protocol}://${req.get("host")}/uploads/${img}`)
      return roomObj
    })

    res.json(roomsWithImageUrls)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Public booking route
app.post("/api/bookings", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, roomName, checkIn, checkOut, guests, specialRequests, totalPrice } =
      req.body

    const room = await Room.findOne({ label: roomName })
    if (!room) return res.status(404).json({ message: "Room not found" })

    const existingBooking = await Booking.findOne({
      roomId: room._id,
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
        { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
      ],
    })

    if (existingBooking) return res.status(400).json({ message: "Room is not available for the selected dates" })

    const booking = new Booking({
      firstName,
      lastName,
      email,
      phone,
      roomName,
      roomId: room._id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      specialRequests,
      totalPrice,
    })

    await booking.save()
    res.status(201).json({ message: "Booking created successfully", booking })
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Public available rooms route
app.get("/api/rooms/available", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query
    if (!checkIn || !checkOut) {
      const rooms = await Room.find()
      return res.json(rooms)
    }

    const bookedRoomIds = await Booking.distinct("roomId", {
      status: { $in: ["confirmed", "checked-in"] },
      $or: [
        { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
        { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
      ],
    })

    const availableRooms = await Room.find({ _id: { $nin: bookedRoomIds } })
    res.json(availableRooms)
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// SERVER START
const PORT = process.env.PORT || 5000
mongoose.connection.once("open", async () => {
  await initializeAdmin()
  await initializeRooms()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Uploads directory: ${uploadsDir}`)
    console.log("Default admin credentials: username: admin, password: admin123")
  })
})

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err)
})
