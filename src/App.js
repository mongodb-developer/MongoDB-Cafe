import React, { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import './App.css';
import Footer from './Footer';

// Initialize Realm
const ATLAS_APP_ID = 'YOUR_APP_ID'; // Replace with your App ID
const app = new Realm.App({ id: ATLAS_APP_ID });

const drinksData = [
  { name: 'Americano', icon: 'americano_icon.png' },
  { name: 'Cafe Latte', icon: 'cafe_latte_icon.png' },
  { name: 'Espresso', icon: 'espresso_icon.png' },
  { name: 'Latte Macchiato', icon: 'latte_macchiato_icon.png' }
];

// Cache MongoDB collection
let coffeeCollection;

// Initialize application and login
async function initializeApp() {
  const user = await app.logIn(Realm.Credentials.anonymous());
  const mongodb = user.mongoClient('mongodb-atlas');
  coffeeCollection = mongodb.db('Cluster0').collection('CoffeeConsumption');
}


async function syncCoffeeConsumption(total) {
  await coffeeCollection.updateOne(
    { user_id: app.currentUser.id },
    { $set: { consumed: total } },
    { upsert: true }
  );
}

// Fetch coffee consumption from the database
async function fetchCoffeeConsumption() {
  const data = await coffeeCollection.findOne({ user_id: app.currentUser.id });
  return data ? data.consumed : 0;
}

// Initialization function for drinksCount
const initDrinksCount = () => drinksData.reduce((acc, drink) => ({
  ...acc,
  [drink.name]: 0
}), {});

function App() {
  const [drinksCount, setDrinksCount] = useState(initDrinksCount);
  const [syncedDrinks, setSyncedDrinks] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  const incrementCount = (drinkName) => {
    setDrinksCount((prevCounts) => ({
      ...prevCounts,
      [drinkName]: prevCounts[drinkName] + 1
    }));
  };

  const decrementCount = (drinkName) => {
    setDrinksCount((prevCounts) => ({
      ...prevCounts,
      [drinkName]: Math.max(prevCounts[drinkName] - 1, 0)
    }));
  };

  const handleSync = async () => {
    const totalDrinks = Object.values(drinksCount).reduce((acc, count) => acc + count, 0);
    await syncCoffeeConsumption(totalDrinks);
    const syncedValue = await fetchCoffeeConsumption();
    setSyncedDrinks(syncedValue);
    alert('Update successfully!');
  };

  return (
    <div className="app">
      <div className="daily-coffee-counter">
        <span className="daily-coffee-label">My daily coffee consumption:</span>
        <span className="daily-coffee-count">{syncedDrinks}</span>
      </div>
      <h1 className="title">MongoDB Cafe</h1>
      <div className="drinks-container">
        {drinksData.map((drink) => (
          <div className="drink" key={drink.name}>
            <img src={drink.icon} alt={drink.name} className="drink-icon" />
            <div className="drink-details">
              <button onClick={() => decrementCount(drink.name)}>-</button>
              <span>{drinksCount[drink.name]}</span>
              <button onClick={() => incrementCount(drink.name)}>+</button>
            </div>
            <div className="drink-name">{drink.name}</div>
          </div>
        ))}
      </div>
      <button onClick={handleSync} className="sync-button">
        Update my daily coffee consumption
      </button>
      <Footer />
    </div>
  );
}

export default App;
