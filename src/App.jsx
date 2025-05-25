import "./App.css";
import { useState } from "./react/react/React";

export default function App() {
  const [count, setCount] = useState(1);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setCount(count => count + 1);
  //   }, 10000);
  // }, []);

  return (
    <div>
      <h1>{count}</h1>
      <h2>aaaa</h2>
      {/* <h1>1212121</h1> */}
    </div>
  );
}
