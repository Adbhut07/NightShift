
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas connection string (replace with your connection string)
const mongoURI = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(mongoURI);

// Define MongoDB schema and model (for example, User)
const userSchema = new mongoose.Schema({
  name: String,
  houseNo: String,
  block: String,
  mobileNo: String,
  selectedDates: [{
    date: Date,
    shift: String,
  }],
});

const User = mongoose.model('User', userSchema);

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, houseNo, block, mobileNo } = req.body;

    // Check if a user with the same name and house number already exists
    const existingUser = await User.findOne({ name, houseNo });

    if (existingUser) {
      return res.status(400).json({ error: 'User with the same name and house number already exists.' });
    }

    // If the user doesn't exist
    const user = new User({ name, houseNo, block, mobileNo });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post("/api/select-date", async (req, res) => {
  try {
    const { userId, date, shift } = req.body;
    const user = await User.findById(userId);

    // Check if the user has already chosen the same date and shift
    const existingDateIndex = user.selectedDates.findIndex(
      (selectedDate) =>
        selectedDate.date.toDateString() === new Date(date).toDateString() &&
        selectedDate.shift === shift
    );

    if (existingDateIndex !== -1) {
      return res
        .status(400)
        .json({
          error:
            "You have already chosen this date and shift. Please choose another.",
        });
    }

    // Check if more than two users have selected the same date and shift
    const usersWithSameDateAndShift = await User.find({
      "selectedDates.date": new Date(date),
      "selectedDates.shift": shift,
    });

    if (usersWithSameDateAndShift.length >= 2) {
      return res
        .status(400)
        .json({
          error:
            "Only two users can choose the same date and shift. Please choose another.",
        });
    }

    // If the user has already selected a date then delete the previous date
    if (user.selectedDates.length > 0) {
      //to delete the earliest selected date
      const earliestDate = user.selectedDates.reduce((earliest, current) =>
        current.date < earliest.date ? current : earliest
      );
      user.selectedDates.pull(earliestDate);
    }

    // Add the new selected date
    user.selectedDates.push({ date, shift });
    await user.save();

    res.status(200).json({ message: "Date selected successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
