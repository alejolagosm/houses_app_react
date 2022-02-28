import React from 'react';

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';

import { db } from '../firebase.config';
import { toast } from 'react-toastify';

import Spinner from '../components/Spinner';
import ListingItem from '../components/ListingItem';

function Offers() {
  // Create State Variables
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create parameters from the url address
  const params = useParams();

  // UseEffect is a function that runs everytime a variable in the [] changes
  useEffect(() => {
    // This async function searches for all the listings in the database and adds them to the variable
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(
          listingsRef,
          where('offer', '==', true),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const querySnap = await getDocs(q);
        const listings = [];
        querySnap.forEach(doc => {
          return listings.push({
            id: doc.id,
            data: doc.data(),
          });
        });
        setListings(listings);
        setLoading(false);
      } catch (err) {
        toast.error('Unable to find the listings');
      }
    };
    // Call the function to get the listings
    fetchListings();
  }, []);

  // JSX return of all the listings that have offers
  return (
    <div className="category">
      <header>
        <p className="pageHeader">Best Offers</p>
      </header>
      {loading ? (
        <Spinner />
      ) : listings && listings.length > 0 ? (
        <>
          <main>
            <ul className="categoryListings">
              {listings.map(listing => (
                <ListingItem
                  listing={listing.data}
                  id={listing.id}
                  key={listing.id}
                />
              ))}
            </ul>
          </main>
        </>
      ) : (
        <p>Wow, the market is crazy hot right now. No offers currently</p>
      )}
    </div>
  );
}

export default Offers;
