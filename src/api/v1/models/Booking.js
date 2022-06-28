const mongoose = require("mongoose");
const { default: validator } = require("validator");
const overalappingDates = require("../../utils/dateValidation");
const CustomError = require("../../utils/CustomError");

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      required: true,
    },
    clientName: {
      type: String,
      required: [true, "A user must have a name"],
      trim: true,
      minlength: [1, "A user name must have more than 8 characters"],
      maxlength: [100, "A user name must not have more than 40 characters "],
    },
    clientEmail: {
      type: String,
      validate: {
        validator: function (email) {
          return validator.isEmail(email);
        },
        message: "Invalid email supplied",
      },
      trim: true,
      lowercase: true,
      required: [true, "This field is required"],
    },
    clientPhoneNumber: {
      type: String,
      validate: {
        validator: function (val) {
          return validator.isMobilePhone(val, "any");
        },
        message: "Invalid phone number supplied",
      },
    },
    hallname: {
      type: String,
      required: [true, "Choose a hall to book"],
      trim: true,
    },
    event: {
      type: String,
      maxlength: [
        500,
        "The event description cannot be more than 500 characters",
      ],
      trim: true,
    },
    attendance: {
      type: Number,
      min: [5, "Attendance cannot be less than 5"],
      max: [
        3000,
        "Due to health regulations, attendance must be less than 3000",
      ],
      default: 100,
    },
    paid: {
      type: String,
      enum: ["unpaid", "deposit", "paid"],
      default: "unpaid",
    },
    total: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    bookedFrom: Date,
    bookedTo: {
      type: Date,
    },
    sessions: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.pre("save", async function (next) {
  const bookings = await this.collection
    .aggregate([
      {
        $match: { hallname: this.hallname },
      },
      {
        $project: {
          hallname: 1,
          bookedFrom: 1,
          bookedTo: 1,
        },
      },
    ])
    .toArray();
  bookings.some((book) => {
    let results = overalappingDates([
      {
        start: book.bookedFrom,
        end: book.bookedTo,
      },
      {
        start: this.bookedFrom,
        end: this.bookedTo,
      },
    ]);
    if (results.overlap === true) {
      return next(new CustomError(11000, "Duplicate Entry", results));
    }
  });
  next();
});

BookingSchema.statics.validateSession = async function (sess) {
  const book = this;
  if (sess.length > 1) {
    book.sessions = sess.map((s) => {
      return {
        morning: "morning",
        evening: "evening",
      };
    });
  } else {
    book.sessions = sess.map((s) => {
      if (s === "morning") {
        return {
          morning: "morning",
        };
      } else {
        return {
          evening: "evening",
        };
      }
    });
  }

  await book.save();
  return book.sessions;
};

const Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
