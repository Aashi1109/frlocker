const searchBtn = document.querySelector(".open__search-btn");
const searchInput = document.querySelector(".open__search-input");
const searchMsg = document.querySelector(".open__message");
const bankerRecognize = document.querySelector(".open__recognize--banker");
const userRecognize = document.querySelector(".open__recognize--user");
const successRecognize = document.querySelector(".open__recognize-success");
// const path = require("path");
// const lockerid = undefined;

const msgBox = function (ele, eleInp = undefined, msg, type = "error") {
  ele.classList.add(`open__message--${type}`);
  ele.classList.remove("hidden");
  ele.innerHTML = msg;
  if (eleInp) {
    eleInp.focus();
  }
  setTimeout(function () {
    ele.classList.add("hidden");
    ele.classList.remove(`open__message--${type}`);
  }, 2000);
};

const makeRequest = async (url, options = {}) => {
  const response = await fetch(url, options)
    .then((resp) => {
      return resp.json();
    })
    .catch((err) => {
      console.log("err at makeRequest", err);
      console.error(err);
    });

  return response;
};

const btnRecog = function (btn, lockerid, whom) {
  btn.classList.remove("hidden");

  btn.addEventListener("click", async function () {
    const url = `http://localhost:8082/recognize/${lockerid}/${whom}/reco`;
    const resp = await makeRequest(url);
    if (!resp) return;
  });
};

const doContinuous = (url, task, lockerid) => {
  const interval1 = setInterval(async () => {
    const status = await makeRequest(url);
    console.log("in continuos", url);
    // console.log(status);
    if (status["status"]) {
      clearInterval(interval1);
      task(url, lockerid);
    }
  }, 1000);
};

const afterBanker = (url, lockerid) => {
  msgBox(searchMsg, undefined, "Banker Recognition Done", "success");
  btnRecog(userRecognize, lockerid, "user");
  doContinuous(url, afterUser, lockerid);
};

const afterUser = (_, lockerid) => {
  msgBox(searchMsg, undefined, "User Recognition Done", "success");
  msgBox(
    successRecognize,
    undefined,
    "Recognition done successfully opening lock",
    "success"
  );
  lockFunc(lockerid);
};

const lockFunc = async (lockerid) => {
  const options = { method: "POST" };
  const open_url = `http://localhost:8082/api/open/${lockerid}/park.1109/aashish.1109`;
  const sendOpenSignal = await makeRequest(open_url, options);
  console.log("lock open request ", sendOpenSignal);

  // console.log(logging);
  const lock_url = `http://localhost:8082/api/lock/park.1109/aashish.1109`;
  setTimeout(async () => {
    const resp = await makeRequest(lock_url, options);
    console.log("lock close request ", resp);
    const log_url = `http://localhost:8082/logging/${lockerid}`;
    const logging = await makeRequest(log_url);
  }, 20000);
};

searchBtn.addEventListener("click", async function (e) {
  const lockerid = searchInput.value.trim();
  if (!lockerid) {
    lockerid = lockerid;
    msgBox(searchMsg, searchInput, "Please enter some value");
  } else {
    const search_url = `http://localhost:8082/locker/${lockerid}`;
    const account = await makeRequest(search_url);
    console.log(account);
    if (!account) {
      msgBox(searchMsg, searchInput, "Incorrect Locker ID");
      return;
    } else {
      msgBox(searchMsg, undefined, "Locker Found", "success");
      btnRecog(bankerRecognize, lockerid, "banker");

      const reco_url = "http://localhost:8082/reco/status";
      doContinuous(reco_url, afterBanker, lockerid);
    }
  }
});
