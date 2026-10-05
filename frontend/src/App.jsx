import React from 'react';
// 1. සාදාගත් PriceSimulator component එක import කරගැනීම
import PriceSimulator from './components/PriceSimulator';

function App() {
  return (
    <div>
      {/* 2. වෙබ් පිටුව තුළ PriceSimulator එක පෙන්වීම */}
      <PriceSimulator />
    </div>
  );
}

export default App;