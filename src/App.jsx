import "./App.css";
import { useState } from "./react/react/React";

export default function App() {
  return (
    <div>
      <h1>222</h1>
      {[1, 2, 3, 4].map(item => (<h2>{item}</h2>))}
    </div>
  );
}

// export default function App() {
//   const [count, setCount] = useState(1);
//   const [count2, setCount2] = useState(100);

//   const handleClick = () => {
//     console.log("handleClick", count);
//     setCount((count) => count + 1);
//   };

//   const handleClick2 = (e) => {
//     e.stopPropagation();
//     console.log("handleClick", count2);
//     setCount2((count) => count + 1);
//   };

//   return (
//     <div>
//       <h1 onClick={handleClick}>
//         {count}
//         <h2 onClick={handleClick2}>{count2}</h2>
//       </h1>

//       <h1>1212121</h1>
//     </div>
//   );
// }
