import "./App.css";
import { useState } from "./react/react/React";

export default function App() {
  const [count, setCount] = useState(1);

  const handleClick = () => {
    console.log('handleClick', count);
    setCount(count => count + 1)
  }
  return (
    <div>
      <h1 onClick={handleClick}>{count}</h1>
      <h2>aaaa</h2>
      <h1>1212121</h1>
    </div>
  );
}
