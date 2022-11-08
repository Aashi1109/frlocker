if (process.env.NODE_ENV === "production") {
  const dotenv = require("dotenv");
}

const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
// const bodyParser = require("body-parser");
const multer = require("multer");
const { Config } = require("./models/config");
const { Customer } = require("./models/customer");
const { Account } = require("./models/account");
const { runPython } = require("./extras/runPython");
const { Logging } = require("./models/logging");
const { mainData, genChart } = require("./controllers/recoChartData");
const { Chart } = require("chart.js");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { id } = req.params;

    const dir = `./public/uploads/${id}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
    // console.log(req.body);
  },
  filename: function (req, file, cb) {
    console.log(file.mimetype);
    cb(null, file.originalname);
  },
});
// const upload = multer({ dest: "/uploads" });
const upload = multer({ storage });

const app = express();
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
// app.use(bodyParser.json());

const port = 8082;
let isRecoDone = false;

mongoose
  .connect("mongodb://localhost:27017/frlocker")
  .then(() => console.log("Database Connection Done"))
  .catch((err) => {
    console.log("Error in connection");
    console.log(err);
  });

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});

app.get(["/", "/home"], async (req, res) => {
  const recoLogs = await Logging.find().sort("date");
  res.render("home", { Chart, recoLogs });
});

app.get("/chart/home", async (req, res) => {
  const data = await mainData();
  return res.json(data);
});
// app.get(, async (req, res) => {
//   const user = await Customer.find({ id: "6343e925cded3681fd8075b9" });
//   res.render("home", { user });
// });

app.get("/account", async (req, res) => {
  const accounts = await Account.find().populate("primary secondary");
  // accounts.map(i)
  console.log("accounts", accounts);
  res.render("locker/account", { accounts });
});
app.get("/add", async (req, res) => {
  const { i } = await Config.findOne();
  // console.log(Config.find({}));
  const lockerID = `LCR${i}`;
  res.render("locker/add", { lockerID });
});
app.get("/open", (req, res) => {
  res.render("locker/open");
});

app.post("/add/:id", upload.array("image"), async (req, res) => {
  // console.log(req.body);
  console.log("post request");
  const { id } = req.params;
  const p_data = {
    first: req.body.p_first,
    middle: req.body.p_middle,
    last: req.body.p_last,
    isActive: "Yes",
    address: req.body.p_address,
    city: req.body.p_city,
    state: req.body.p_state,
    country: req.body.p_country,
  };

  const p_image = req.files[0].path.replace("public\\", "") || "";
  // console.log(p_image);
  const p_cust = new Customer(p_data);
  await p_cust.save();

  const { s_first } = req.body;
  let s_data = "";
  let s_image = undefined;
  if (s_first) {
    s_image = req.files[1].path.replace("public\\", "") || "";
    s_data = {
      first: s_first,
      middle: req.body.s_middle,
      last: req.body.s_last,
      isActive: "Yes",
      image: s_image,
      address: req.body.s_address,
      city: req.body.s_city,
      state: req.body.s_state,
      country: req.body.s_country,
    };
  }

  const s_cust = new Customer(s_data);
  await s_cust.save();

  const account_data = {
    lockerid: id,
    primary: p_cust,
    secondary: s_cust,
    p_enco: "",
    s_enco: "",
    p_img: p_image,
    s_img: s_image,
  };

  const p_account = new Account(account_data);
  await p_account.save();
  const { i } = await Config.findOne();
  await Config.findOneAndUpdate({ i }, { i: i + 1 });

  console.log("Account saved");
  return res.redirect("/account");

  // console.log(req.files);
});

app.get("/locker/:id", async (req, res) => {
  const { id } = req.params;
  const locker = await Account.findOne({ lockerid: id });
  // console.log(locker);
  return res.json(locker);
});

app.get("/recognize/:id/:whom/:what", async (req, res) => {
  const { id, whom, what } = req.params;
  runPython(id, whom, what);
});

app.get("/process/comm/:data", (req, res) => {
  const { data } = req.params;

  if (data === "SM_RECO_T") isRecoDone = true;

  console.log("process ->", data);
  return res.json({ receive: true });
});

app.get("/reco/status", (req, res) => {
  res.json({ status: isRecoDone });
  isRecoDone = false;
});

app.get("/logging/:id", async (req, res) => {
  const { id } = req.params;
  const account = await Account.findOne({ lockerid: id }).populate("primary");
  console.log(account);
  const p_name = `${account["primary"]["first"]} ${account["primary"]["middle"]} ${account["primary"]["last"]}`;
  const lockLog = await Logging({
    lockerid: id,
    p_user: p_name,
    p_img: account["p_img"],
  });
  console.log(lockLog);
  await lockLog.save();
  return res.redirect("/");
});

// API
let lock_state = "close";
let lock_id = null;
const api_username = "park.1109";
const api_password = "aashish.1109";
// const port_number = process.env.PORT ?? 8081;

// helper functions
const check_credentials = (username, password) => {
  if (username === api_username && password === api_password) return 1;
  // console.log(username, api_username);
  return 0;
};

const success_message = () => {
  const response = { message: "success", lock_state };
  return response;
};

const error_message = () => {
  const response = {
    message: "failed",
    err: { message: "Invalid credentials" },
  };

  return response;
};

const send_response = (state, username, password, res) => {
  if (check_credentials(username, password)) {
    lock_state = state;
    return res.send(success_message());
  }
  lock_id = null;
  return res.send(error_message());
};

// Routing and urls
// GET requests
// URL to get state of the locker
app.get("/api/lock_state", (_, res) => {
  if (lock_id !== null && lock_state !== "lock") {
    return res.send({
      lock_state,
      lock_id,
    });
  }
  return res.send({ lock_state });
});

// POST requests
// URL to open the locker with a id
app.post("/api/open/:id/:username/:password", (req, res) => {
  const { username, password, id } = req.params;
  lock_id = id;
  return send_response("open", username, password, res);
});

// URL to lock the locker
app.post("/api/lock/:username/:password", (req, res) => {
  const { username, password } = req.params;
  lock_id = null;
  return send_response("close", username, password, res);
});
