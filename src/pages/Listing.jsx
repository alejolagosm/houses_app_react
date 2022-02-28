import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';

import Spinner from '../components/Spinner';
import shareIcon from '../assets/svg/shareIcon.svg';

function Listing() {
  // State variables of the component
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  //   Navigate and params variables
  const navigate = useNavigate();
  const params = useParams();
  // Auth credentials for the user
  const auth = getAuth();

  useEffect(() => {
    // Fetch the listing data from the data base
    const getListing = async () => {
      const docRef = doc(db, 'listings', params.listingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setListing(docSnap.data());
        setLoading(false);
      }
    };
    getListing();
  }, [navigate, params.listingId]);

  if (loading) {
    return <Spinner />;
  }
  return (
    <main>
      <div
        className="shareIconDiv"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setShareLinkCopied(true);
          setTimeout(() => {
            setShareLinkCopied(false);
          }, 2000);
        }}
      >
        <img src={shareIcon} alt="Share Icon" />
      </div>
      {shareLinkCopied && (
        <p className="linkCopied">Link Copied to ClipBoard</p>
      )}
      <div className="listingDetails">
        <p className="listingName">
          {listing.name} - $
          {listing.offer
            ? listing.discountedPrice
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            : listing.regularPrice
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </p>
        <p className="listingLocation">{listing.location}</p>
        <p className="listingType">FOR {listing.type.toUpperCase()}</p>
        {listing.offer && (
          <p className="discountPrice">
            ${listing.regularPrice - listing.discountedPrice} discount
          </p>
        )}
        <ul className="listingDetailsList">
          <li>
            {listing.bedrooms} Bedroom{listing.bedrooms > 1 && `s`}
          </li>
          <li>
            {listing.bathrooms} Bathroom{listing.bathrooms > 1 && `s`}
          </li>
          <li>{listing.parking && 'With Parking'}</li>
          <li>{listing.parking && 'Fully furnished'}</li>
        </ul>
        <p className="listingLocationTitle">Location</p>
        {/* {Map} */}
        {auth.currentUser?.uid !== listing.userRef && (
          <Link
            to={`/contact/${listing.userRef}?listingName=${listing.name}`}
            className="primaryButton"
          >
            Contact Listing Owner
          </Link>
        )}
      </div>
    </main>
  );
}

export default Listing;
