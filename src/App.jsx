import "./App.css";
import { useState } from "./react/react/React";

export default function App() {
  const [count, setCount] = useState(1);

  return (
    <div>
      <h1 onClick={() => setCount(count => count + 1)}>{count}</h1>
      <h2>aaaa</h2>
      <h1>1212121</h1>
    </div>
  );
}
