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

function Category() {
  // Create State Variables
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  // Create parameters from the url address
  const params = useParams();

  // UseEffect is a function that runs everytime a variable in the [] changes. In this case, it runs every time you change the url category name (Sale or rent)
  useEffect(() => {
    // This async function searches for all the listings in the database and adds them to the variable
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(
          listingsRef,
          where('type', '==', params.categoryName),
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
    fetchListings();
  }, [params.categoryName]);

  // JSX return
  return (
    <div className="category">
      <header>
        <p className="pageHeader">Places for {params.categoryName}</p>
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
        <p>No listings for {params.categoryName}</p>
      )}
    </div>
  );
}

export default Category;
