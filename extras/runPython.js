const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { spawn } = require("child_process");
let dataFound = undefined;
const runPython = function (id, whom, what) {
  const pythonProcess = spawn("python", ["fr_final.py", id, whom, what]);

  pythonProcess.stdout.on("data", (data) => {
    dataFound = data.toString();
    console.log(dataFound);
    // return resolve(resp);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
  pythonProcess.on("exit", async () => {
    const url = `http://localhost:8082/process/comm/${dataFound}`;
    // const data = await fetch(url)
    //   .then((resp) => resp)
    //   .catch((err) => console.error(err));
    const response = await fetch(url)
      .then((res) => res.json())
      .catch((err) => console.error(err));
    console.log(response);
  });
};

module.exports = { runPython };
