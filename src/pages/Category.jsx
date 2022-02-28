import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

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

import Spinner from '../components/Spinner';
import ListingItem from '../components/ListingItem';

function Category() {
  // Create State Variables
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedListing, setLastFetchListing] = useState(null);
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
          limit(5)
        );
        const querySnap = await getDocs(q);

        // This variable indicates the amount of fetched listings
        const lastVisible = querySnap.docs[querySnap.docs.length - 1];
        setLastFetchListing(lastVisible);
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

  // Function to load more listings
  const onFetchMoreListings = async () => {
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(
        listingsRef,
        where('type', '==', params.categoryName),
        orderBy('timestamp', 'desc'),
        startAfter(lastFetchedListing),
        limit(5)
      );
      const querySnap = await getDocs(q);
      // This variable indicates the amount of fetched listings
      const lastVisible = querySnap.docs[querySnap.docs.length - 1];
      setLastFetchListing(lastVisible);
      const listings = [];
      querySnap.forEach(doc => {
        return listings.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      // Adding new fetched listings to the listings state variable
      setListings(prevState => [...prevState, ...listings]);
      setLoading(false);
    } catch (err) {
      toast.error('Unable to find the listings');
    }
  };

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
          <br />
          {lastFetchedListing && (
            <p className="loadMore" onClick={onFetchMoreListings}>
              Load More
            </p>
          )}
        </>
      ) : (
        <p>No listings for {params.categoryName}</p>
      )}
    </div>
  );
}

export default Category;
