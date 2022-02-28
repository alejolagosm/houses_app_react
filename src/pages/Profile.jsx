import React from 'react';

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getAuth, updateProfile } from 'firebase/auth';
import {
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';

import ListingItem from '../components/ListingItem';

import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg';
import homeIcon from '../assets/svg/homeIcon.svg';

function Profile() {
  // Get User Credentials
  const auth = getAuth();

  // State variables of the component
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changeDetails, setChangeDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  // Destructuring to get the data for the form
  const { name, email } = formData;

  // Navigate hooks to redirect to different pages
  const navigate = useNavigate();

  // Hook to get all the user listings when the component renders
  useEffect(() => {
    const getUserListings = async () => {
      const listingsRef = collection(db, 'listings');
      const q = query(
        listingsRef,
        where('userRef', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnap = await getDocs(q);
      let listings = [];
      querySnap.forEach(doc => {
        return listings.push({
          id: doc.id,
          data: doc.data(),
        });
      });
      setListings(listings);
      setLoading(false);
    };
    getUserListings();
  }, [auth.currentUser.uid]);

  // Function to log out
  const onLogout = () => {
    auth.signOut();
    navigate('/');
  };

  // Function to change the name of the user
  const onSubmit = async () => {
    try {
      if (auth.currentUser.displayName !== name) {
        // Update Display Name in firebase
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
        // Update in firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          name,
        });
      }
    } catch (err) {
      toast.error('Unable to update profile Details');
    }
  };

  // Changing the state variable of name when the user changes the form field
  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Function to delete a listing item of the user profile
  const onDelete = async listingId => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      const docRef = doc(db, 'listings', listingId);
      await deleteDoc(docRef);
      const updatedListings = listings.filter(
        listing => listing.id != listingId
      );
      setListings(updatedListings);
      toast.success('Successfully deleted listing');
    }
  };
  // Function to edit the listing, only redirects to the edit-listing page
  const onEdit = listingId => {
    navigate(`/edit-listing/${listingId}`);
  };

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="pageHeader">My Profile</p>
        <button type="button" className="logOut" onClick={onLogout}>
          Log Out
        </button>
      </header>
      <main>
        <div className="profileDetailsHeader">
          <p className="profileDetailsText">Personal Details</p>
          <p
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && onSubmit();
              setChangeDetails(prevState => !prevState);
            }}
          >
            {changeDetails ? 'done' : 'change'}
          </p>
        </div>
        <div className="profileCard">
          <form>
            <input
              type="text"
              id="name"
              className={!changeDetails ? 'profileName' : 'profileNameActive'}
              disabled={!changeDetails}
              value={name}
              onChange={onChange}
            />
            <input
              type="email"
              id="email"
              className="profileEmail"
              disabled={true}
              value={email}
            />
          </form>
        </div>

        <Link to="/create-listing" className="createListing">
          <img src={homeIcon} alt="Home Icon" />
          <p>Create a listing to sell or rent your home</p>
          <img src={arrowRight} alt="Arrow Button" />
        </Link>
        {/* Return the listings of the user */}
        {!loading && listings?.length > 0 && (
          <>
            <p className="listingText">Your listings</p>
            <ul className="listingsList">
              {listings.map(listing => (
                <ListingItem
                  key={listing.id}
                  listing={listing.data}
                  id={listing.id}
                  onDelete={() => onDelete(listing.id)}
                  onEdit={() => onEdit(listing.id)}
                ></ListingItem>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
