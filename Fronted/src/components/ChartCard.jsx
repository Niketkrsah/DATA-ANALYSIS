import React, { useState } from 'react';
import { Card, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { Bar, Line, Pie } from 'react-chartjs-2';

import '../App.css'; 
import 'bootstrap/dist/css/bootstrap.min.css'; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Interaction
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartCard({ title, data, type = 'bar' , darkMode = false}) {
  // console.log(`Rendering chart for: ${title}`, data);
  const [chartType, setChartType] = useState(type);

  // Fallback if data is invalid or empty
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <p className="text-muted">⚠️ No data available for "{title}"</p>
        </Card.Body>
      </Card>
    );
  }
  const isPieChart = title === 'No Focused Window';
  let labels = Object.keys(data);
  const fullLabels = labels;
  // console.log(`Initial labels for ${title}:`, labels);
  const new_labels= labels.map(label => {
    // console.log(`Processing label: ${label}`);
    if (title == 'Top Backtrace Chains') {
      return label.substring(0, 10) + '...';
    }
    return label;
  });


  const new_labels2= labels.map(label => {
  if (title == 'Simplified ANR Subjects') {
      return label.substring(0, 10) + '...';
    }
    return label;
  });

  const new_labels3= labels.map(label => {
    if (title == 'Top ANR Activities') {
      return label.substring(0, 10) + '...';
    }
    return label;
  });
  // console.log(`Processed labels for ${title}:`, new_labels);
  // console.log(`chart labels for ${title}:`, labels);

  const values = Object.values(data);

  // Random color for visual variety
  const colors = ['#0d6efd', '#6610f2', '#198754', '#dc3545', '#fd7e14'];
  let color = colors[Math.floor(Math.random() * colors.length)];
  // chart bar count greater than 75% diffreent colour , 50% difrrent color , 25% diffrent colour
  if (values.length > 0 ) {
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    const threshold1 = minValue + 0.75 * range;
    const threshold2 = minValue + 0.5 * range;
    const threshold3 = minValue + 0.25 * range;

    color = values.map(value => {
      if (value >= threshold1) return 'red'; //  for high values
      if (value >= threshold2) return 'orange'; //  for medium values
      if (value >= threshold3) return 'blue'; //  for low values
      return 'green'; // Default color
    });
  }
  
  const chartData = {
  labels:
    title === 'Top Backtrace Chains'
      ? new_labels
      : title === 'Simplified ANR Subjects'
      ? new_labels2
      : title === 'Top ANR Activities'
      ? new_labels3
      : labels,
    datasets: [
      {
        label: title ,
        data: values,
        backgroundColor: color,
        borderWidth: isPieChart ? 0 : 1,
        borderColor: isPieChart? '#fff':color,
        fill: false
      }
    ]
  };

  const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      display: isPieChart,
      labels: {
        color: darkMode ? '#fff' : '#000'
      }
    },
    title: {
      display: true,
      text: title,
      color: darkMode ? '#fff' : '#000'
    },
    tooltip: {
      backgroundColor: darkMode ? '#333' : '#fff',
      titleColor: darkMode ? '#fff' : '#000',
      bodyColor: darkMode ? '#fff' : '#000',
      callbacks: {
        title: (tooltipItems) => {
          const index = tooltipItems[0].dataIndex;
          const fullLabel = fullLabels[index];
          return fullLabel.match(/.{1,40}/g);
        },
        label: (tooltipItem) => {
          const val = tooltipItem.formattedValue;
          return `Value: ${val}`;
        }
      }
    }
  },
  ...(isPieChart ? {} : {
    scales: {
      x: {
        ticks: {
          color: darkMode ? '#fff' : '#000'
        },
        grid: {
          color: darkMode ? '#444' : '#ccc'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#fff' : '#000'
        },
        grid: {
          color: darkMode ? '#444' : '#ccc'
        }
      }
    }
  })
};



const ChartComponent = isPieChart ? Pie : (chartType === 'line' ? Line : Bar);


  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        {!isPieChart && (
        <ButtonGroup className="mb-3">
          {['bar', 'line'].map((val, idx) => (
          // console.log(`Rendering ${val} chart for: ${title}`),
            <ToggleButton
              key={idx}
              id={`chart-${val}-${title}`}
              type="radio"
              variant="outline-primary"
              name={`chartType-${title}`}
              // name="chartType"
              value={val}
              checked={chartType === val}
              onChange={(e) => setChartType(e.currentTarget.value)}
              size="sm"
            >
              {val.toUpperCase()}
            </ToggleButton>
          ))}
        </ButtonGroup>
        )}
        <div className="chart-scroll-wrapper">
  <div className="chart-inner">
    <ChartComponent data={chartData} options={options} title={title} />
    
  </div>
</div>
      </Card.Body>
    </Card>
  );
} 