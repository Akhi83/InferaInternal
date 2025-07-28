import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Form } from 'react-bootstrap';
import { FiSend } from 'react-icons/fi';
import './DisplayPanel.css';

const DisplayPanel = ({ messages, onSend, onEmptyClick, showInput }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll messages ONLY
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div
      className="display-panel d-flex flex-column h-70"
      onClick={() => {
        if (messages.length === 0 && onEmptyClick) {
          onEmptyClick();
        }
      }}
    >
      <div
        ref={messagesContainerRef}
        className="messages flex-grow-1 overflow-auto p-3"
      >
        {messages.length === 0 ? (
          <div className="text-center mt-5 blank-display">
            {showInput ? null : "Click to start a new conversation"}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-4">
              <div className="user-message">{msg.prompt}</div>
              <div className="bot-message">
                {isJson(msg.response) ? (() => {
                  const data = JSON.parse(msg.response);
                  return (
                    <div>
                      <p><strong>Query:</strong></p>
                      <p>{data.query}</p>

                      <p><strong>Explanation:</strong></p>
                      <p>{data.explanation}</p>

                      <p><strong>Results:</strong></p>
                      {Array.isArray(data.results) && data.results.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-sm">
                            <thead>
                              <tr>
                                {Object.keys(data.results[0]).map((key) => (
                                  <th key={key}>{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {data.results.map((row, idx) => (
                                <tr key={idx}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j}>{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p>No results.</p>
                      )}

                      {data.visualization?.why && (
                        <>
                          <p><strong>Visualization:</strong></p>
                          <p>{data.visualization.why}</p>

                          {data.visualization.type !== "none" && data.results.length > 0 && data.visualization.x_axis && data.visualization.y_axis && (
                            <div className='visualization-scroll'>
                              <Plot
                                data={[{
                                  type: data.visualization.type === "pie" ? "pie" : data.visualization.type,
                                  x: data.visualization.type === "pie" ? undefined : data.results.map(row => row[data.visualization.x_axis]),
                                  y: data.results.map(row => row[data.visualization.y_axis]),
                                  labels: data.visualization.type === "pie" ? data.results.map(row => row[data.visualization.x_axis]) : undefined,
                                  values: data.visualization.type === "pie" ? data.results.map(row => row[data.visualization.y_axis]) : undefined,
                                  mode: data.visualization.type === "scatter" ? "markers" : undefined,
                                  marker: data.visualization.color ? { color: data.results.map(row => row[data.visualization.color]) } : undefined,
                                }]}
                                layout={{
                                  title: data.visualization.title || 'Visualization',
                                  xaxis: { title: data.visualization.x_axis },
                                  yaxis: { title: data.visualization.y_axis },
                                  height: 400,
                                  margin: { t: 40, l: 50, r: 30, b: 50 },
                                }}
                                config={{ responsive: true, displayModeBar: false }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })() : msg.response}
              </div>
            </div>
          ))
        )}
      </div>

      {showInput && (
        <Form onSubmit={handleSubmit} className="input-panel">
          <div className="input-inner d-flex align-items-center">
            <Form.Control
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={textareaRef}
              placeholder="Type your message..."
              className="message-input"
            />
            <button type="submit" disabled={!message.trim()} className="send-btn">
              <FiSend size={18} />
            </button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default DisplayPanel;