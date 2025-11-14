import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Chart.js에서 필요한 요소를 등록합니다. (필수)
ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ['빨강', '파랑', '노랑'],
  datasets: [
    {
      label: '내 데이터셋',
      data: [300, 50, 100], // 차트 값
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const AnimatedDoughnutChart = () => {
  // 별도의 애니메이션 설정이 없어도 기본적으로 애니메이션이 적용됩니다.
  return (
  <div style={{ width: '400px', height: '400px', display: 'flex', justifyContent:'center' }}>
    <Doughnut data={data} />;
  </div>
  )
};

export default AnimatedDoughnutChart;