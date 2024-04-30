import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Import axios

import './App.css';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [positionsArray, setPositionsArray] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5251/positions")
      .then((response) => {
        setPositionsArray(response.data);
        if (response.data.length > 0) {
          setPosition({ x: response.data[0].x, y: response.data[0].y });
          // positionsArray({ x: response.data[0].xPos, y: response.data[0].yPos })
        }
        console.log("Positions array:", response.data); // Add this line
      })
      .catch((error) => {
        console.error("Error fetching positions:", error);
      });
  }, []);
  
  const handleStartClick = () => {
    setIsStarted(true);
  };

  const handlePanelMouseDown = (e) => {
    if (isStarted && !isDragging) {
      setIsDragging(true);
      handleMouseMove(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setPosition({
        x: Math.min(Math.max(0, offsetX), rect.width - 50), // Adjusted to keep the box fully inside the panel
        y: Math.min(Math.max(0, offsetY), rect.height - 50), // Adjusted to keep the box fully inside the panel
      });
      // Add the position to the positionsArray
      setPositionsArray([{ x: offsetX, y: offsetY }]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClear = async () => {
    try {
      const response = await axios.delete("http://localhost:5251/positions");
      setPositionsArray([]);
      setPosition({x:0,y:0})
      console.log(response.data);
      // Optionally, you can show a success message or trigger a state update
    } catch (error) {
      console.error("Error clearing positions:", error);
      // Handle errors - show an error message or log the error
    }
  };

  useEffect(() => {
    let timeoutId;

    const sendData = async () => {
      try {
        const move = positionsArray.length.toString();
        const xpos = positionsArray[positionsArray.length - 1].x.toFixed(2);
        const ypos = positionsArray[positionsArray.length - 1].y.toFixed(2);
        console.log(xpos,ypos)

        // #for dotnet
        const response = await axios.post("http://localhost:5251/position", {
          id: move,
          x: xpos,
          y: ypos
        });
        console.log(response.data);
      } catch (error) {
        console.error("Error sending data:", error);
      }
    };

    const debouncedSendData = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(sendData, 300); // Debounce with 300ms delay
    };

    if (positionsArray.length > 0) {
      debouncedSendData();
    }

    return () => {
      clearTimeout(timeoutId); // Clear the timeout on component unmount or re-render
    };
  }, [positionsArray]);

  return (
    <div className="App">
      <button onClick={handleStartClick} disabled={isStarted}>
        Start
      </button>
      <button onClick={handleClear}>
        Clear
      </button>

      {isStarted && (
        <div
          className="panel"
          onMouseDown={handlePanelMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="box" style={{ left: position.x, top: position.y }}></div>
        </div>
      )}
      {positionsArray.length >= 0 && (
        <table>
          <thead>
            <tr>
              <th>Move</th>
              <th>X Position</th>
              <th>Y Position</th>
            </tr>
          </thead>
          <tbody>
            {positionsArray.map((pos, index) => (
              <tr key={index}>
                {/* {console.log("fjdf",positionsArray)} */}
                {/* {console.log("it is ",pos.x)} */}
                <td>{index + 1}</td>
                <td>{(pos.x).toFixed(2)}</td>
                <td>{(pos.y).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
