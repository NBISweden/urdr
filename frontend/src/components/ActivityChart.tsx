import React, { Component } from "react";
import Chart from "react-google-charts";

const data = [
  ["Task", "Hours per Day"],
  ["Support", 33],
  ["Training", 26],
  ["Professional development", 18],
  ["Internal NBIS", 8],
  ["Admin", 7],
  ["Consultation", 7],
  ["Outreach", 1],
];
//TODO add these colors: ['#5d8227', '#055a62', '#4c969e', '#a6cbd0', '#d2c7d4','#491f53','#d4e4a4']
const pieOptions = {
  title: "Time spent during reporting period\n",
  slices: [
    {
      color: "#5d8227",
    },
    {
      color: "#055a62",
    },
    {
      color: "#4c969e",
    },
    {
      color: "#a6cbd0",
    },
    {
      color: "#d2c7d4",
    },
    {
      color: "#491f53",
    },
    {
      color: "#d4e4a4",
    },
  ],
  legend: {
    //position: "left",
    alignment: "center",
    textStyle: {
      color: "233238",
    },
  },
  tooltip: {
    showColorCode: true,
  },
};

class ActivityChart extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container mt-5">
        <Chart
          width={360}
          height={300}
          data={data}
          chartType="PieChart"
          loader={<div>Loading Chart...</div>}
          options={pieOptions}
        />
      </div>
    );
  }
}

export default ActivityChart;
