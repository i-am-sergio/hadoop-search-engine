import SearchBox from './components/SearchBox';
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

export default App;