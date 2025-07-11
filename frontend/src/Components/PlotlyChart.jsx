// components/PlotlyChart.jsx
import Plot from 'react-plotly.js';

const PlotlyChart = ({ figureJson }) => {
  if (!figureJson) return null;

  const figure = JSON.parse(figureJson);

  return (
    <Plot
      data={figure.data}
      layout={figure.layout}
      config={figure.config || {}}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler={true}
    />
  );
};

export default PlotlyChart;
