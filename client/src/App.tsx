import SearchEngineView from './components/SearchEngineView';
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
      <SearchEngineView onSearch={handleSearch} />
    </div>
  );
}

export default App;