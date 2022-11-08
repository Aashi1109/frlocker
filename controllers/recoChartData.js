const { Logging } = require("../models/logging");
const { Chart } = require("chart.js");

const genLocData = async (model, id) => {
  const logArray = await model.find({ lockerid: id });
  const monthData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (logArray.length) {
    logArray.map((log) => {
      // console.log(log);
      monthData[log["date"].getMonth()] += 1;
    });
  }
  return monthData;
};

const mainData = async () => {
  const lockers = await Logging.find().distinct("lockerid");

  if (lockers.length) {
    const dataArray = lockers.map(async (locker) => ({
      lockerid: locker,
      data: await genLocData(Logging, locker),
    }));
    return await Promise.all(dataArray);
  }
  return [];
};

// const data = mainData().then((resp) => console.log(resp));

// console.log(data);

// const genChart = function (data) {
//   return function (chartCanvas) {
//     return new Chart(chartCanvas, {
//       type: "line",
//       data: {
//         labels: Array.from(
//           "Januray February March April May June July August September October November December".split(
//             " "
//           )
//         ),
//         datasets: data.map((log) => ({
//           label: log.lockerid,
//           data: log.data,
//           fill: true,
//           borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
//           pointStyle: "circles",
//           pointRadius: 6,
//           tension: 0.2,
//         })),
//       },
//       options: {
//         plugins: {
//           title: {
//             display: true,
//             text: "Recognition History",
//           },
//         },
//         tooltip: {
//           usePointStyle: true,
//         },
//       },
//     });
//   };
// };

module.exports = { mainData };
