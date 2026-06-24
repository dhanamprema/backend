import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });
const studentSchema = new mongoose.Schema({
  rollNo: String,
  name: String,
});
const Student = mongoose.model("Student", studentSchema);
const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["P", "A"],
    required: true,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

app.get("/", (req, res) => {
  res.send("Server has started sucessfully");
});

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/students", async (req, res) => {
  try {
    const newStudent = await Student.create({
      rollNo: req.body.rollNo,
      name: req.body.name,
    });
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find().populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      {
        studentId: studentId,
        date: date,
      },
      { status: status },
      {
        new: true,
        upsert: true,
      },
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
app.get("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({
      date: today,
    }).populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
app.delete("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const result = await Attendance.deleteMany({ date: today });

    res.status(200).json({
      message: "Today's attendance has been completely reset.",
      deleteCount: result.deleteCount,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
