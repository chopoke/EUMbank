import { BrowserRouter, Route, Routes } from "react-router-dom";
import BankHome from './pages/main';
// import Login from './pages/main';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BankHome />}></Route>
          {/* <Route path="/login" element={<Login />}></Route> */}
        </Routes> 
      </BrowserRouter>
    </div>
  );
}

export default App;
