// src/App.tsx
import SearchBox from './components/SearchBox';
import './index.css';
import { extractCocoClassesFromText } from './utils/searchProcessor';

function App() {
  const handleSearch = (query: string) => {
    const resultado = extractCocoClassesFromText(query);
    console.log("Resultado:", resultado);
    alert(`Objetos detectados: ${resultado.join(", ")}`);
  };

  return (
    <div className="App">
      <SearchBox onSearch={handleSearch} />
    </div>
  );
}

export default App;

/*import SearchBox from './components/SearchBox';
import './index.css'; 

function App() {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    alert(`Simulating search for: "${query}"`);
  };

  return (
    <div className="App">
      <SearchBox onSearch={handleSearch} />
    </div>
  );
}

export default App;*/