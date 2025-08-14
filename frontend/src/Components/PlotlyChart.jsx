import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const PlotlyChart = ({ figureJson }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (figureJson && chartRef.current) {
            try {
                const figure = JSON.parse(figureJson);
                Plotly.react(chartRef.current, figure.data, figure.layout);

            } catch (e) {
                console.error("Error parsing or rendering Plotly JSON:", e);
            }
        }
    }, [figureJson]);

    return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

export default PlotlyChart;








// // components/PlotlyChart.jsx
// import Plot from 'react-plotly.js';

// const PlotlyChart = ({ figureJson }) => {
//   if (!figureJson) return null;

//   const figure = JSON.parse(figureJson);

//   return (
//     <Plot
//       data={figure.data}
//       layout={figure.layout}
//       config={figure.config || {}}
//       style={{ width: "100%", height: "100%" }}
//       useResizeHandler={true}
//     />
//   );
// };

// export default PlotlyChart;
