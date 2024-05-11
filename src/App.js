import React, { useState, useEffect } from 'react';
import * as Realm from 'realm-web';
import './App.css';
import Footer from './Footer';

//================Init Realm below
const REALM_APP_ID = 'YOUR APP ID'; // Replace with your App ID
const app = new Realm.App({ id: REALM_APP_ID });

const drinksData = [
  { name: 'Americano', icon: 'americano_icon.png' },
  { name: 'Cafe Latte', icon: 'cafe_latte_icon.png' },
  { name: 'Espresso', icon: 'espresso_icon.png' },
  { name: 'Latte Macchiato', icon: 'latte_macchiato_icon.png' }
];

//================Realm user login below. Here we use anonymous login
async function login() {
  if (!app.currentUser) {
    await app.logIn(Realm.Credentials.anonymous());
  }
  return app.currentUser;
}
//================Set Realm Service Name, app backend collection name and what to CRUD
async function syncCoffeeConsumption(total) {
  const user = await login();
  const mongodb = user.mongoClient('mongodb-atlas'); //Replace this with the 'Service Name' within Linked Data Sources
  const coffeeCollection = mongodb.db('Cluster0').collection('CoffeeConsumption');

  await coffeeCollection.updateOne( //Here using updateOne(Node.js driver)to write total coffee consumption number to backend.  
    { user_id: user.id },
    { $set: { consumed: total } },
    { upsert: true }
  );
}
//================ func for fetching data FROM backend.
async function fetchCoffeeConsumption() {
  const user = await login();
  const mongodb = user.mongoClient('mongodb-atlas');
  const coffeeCollection = mongodb.db('Cluster0').collection('CoffeeConsumption');

  const data = await coffeeCollection.findOne({ user_id: user.id }); //Using `findOne` to find and fetch the total coffee consumption. 
  return data ? data.consumed : 0;
}

function App() {
  const [drinksCount, setDrinksCount] = useState(
    drinksData.reduce((acc, drink) => ({ ...acc, [drink.name]: 0 }), {})
  );
  const [syncedDrinks, setSyncedDrinks] = useState(0);

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

  //Function used to calculate the total amount of coffee 
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

