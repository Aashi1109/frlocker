// const { response } = require("express");

const myChart = document.getElementById("myChart").getContext("2d");

// console.log(recData);

// const temp = recoData.then((data) => {
//   return data.map((log) => ({
//     label: log.lockerid,
//     data: log.data,
//     fill: false,
//     borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
//     pointStyle: "circles",
//     pointRadius: 6,
//     tension: 0.2,
//   }));
// });

// console.log(temp);

let massPopChart = async function () {
  const recoData = await fetch("/chart/home")
    .then((res) => {
      return res.json();
    })
    .catch((err) => console.error(err));

  console.log(recoData);
  let chartData = [];
  if (recoData.length) {
    chartData = recoData.map((log) => ({
      label: log.lockerid,
      data: log.data,
      fill: false,
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      pointStyle: "circles",
      pointRadius: 6,
      tension: 0.2,
    }));
  } else {
    chartData = [
      {
        label: "No log found",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        fill: false,
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        pointStyle: "circles",
        pointRadius: 6,
        tension: 0.2,
      },
    ];
  }

  return new Chart(myChart, {
    type: "line",
    data: {
      labels: Array.from(
        "Januray February March April May June July August September October November December".split(
          " "
        )
      ),
      datasets: chartData,
      //   datasets: [
      //     {
      //       label: "LCR1800",
      //       data: [12, 19, 3, 5, 2, 3, 0, 19, 25, 12, 21, 34],
      //       fill: false,
      //       borderColor: "rgb(75, 192, 192)",
      //       pointStyle: "circles",
      //       pointRadius: 6,
      //       tension: 0.4,
      //     },
      //   ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Recognition History",
        },
      },
      tooltip: {
        usePointStyle: true,
      },
    },
  });
};
massPopChart();
// let recoChart = genChartFunc(myChart);
