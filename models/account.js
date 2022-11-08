const mongoose = require("mongoose");
const { runPython } = require("../extras/runPython");
const { Customer } = require("./customer");
const { Schema } = mongoose;

const accountSchema = Schema({
  lockerid: String,
  primary: { type: Schema.Types.ObjectID, ref: Customer },
  secondary: { type: Schema.Types.ObjectID, ref: Customer },
  p_enco: String,
  s_enco: String,
  p_img: String,
  s_img: String,
});

accountSchema.post("save", async function (doc) {
  if (doc) {
    console.log(doc);
    try {
      runPython(doc.lockerid, "", "enco");
    } catch (err) {
      console.error(err);
    }
  }
});

const Account = new mongoose.model("Account", accountSchema);
module.exports = { Account };
