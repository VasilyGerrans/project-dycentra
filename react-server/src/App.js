import StickyHeader from './StickyHeader';
import CreatorContent from './CreatorContent';
import SubscriptionContent from './SubscriptionContent';
import './App.css';

function App() {
  return (
    <div className="App">
      <StickyHeader />
      <CreatorContent />
      <SubscriptionContent unlocked={true} />
    </div>
  );
}

export default App;
