import "./App.css";
import { Barplot } from "./Barplot";
import { studentData } from "./data/students";

function App() {
  return (
    <div className="app-wrapper">
      <Barplot
        data={studentData}
        title="Where Are D3 Students From?"
        subtitle="The US accounts for nearly 1 in 3 enrolled students"
        source="Source: @driskerr"
      />
    </div>
  );
}

export default App;
