import React from 'react';
import { useState, useEffect } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'react-toastify';

import { getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase.config';

import Spinner from '../components/Spinner';

function Contact() {
  // State variables of the component
  const [message, setMessage] = useState('');
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  //   Navigate and params variables
  const navigate = useNavigate();
  const params = useParams();
  // Auth credentials for the user (This could be used if you want to restrict the contact only to registered users)
  const auth = getAuth();

  // Get the owner of the listing data when the component loads
  useEffect(() => {
    // Fetch the owner of the listing data from the data base
    const getLandlord = async () => {
      const docRef = doc(db, 'users', params.landlordId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLandlord(docSnap.data());
        setLoading(false);
      } else {
        toast.error('Unable to get the Owner of the listing');
      }
    };
    getLandlord();
  }, [params.landlordId]);

  // Change the state of the message
  const onChange = e => {
    setMessage(e.target.value);
  };

  if (loading) {
    return <Spinner />;
  }
  return (
    <div className="pageContainer">
      <header>
        <p className="pageHeader">Contact Owner of the listing</p>
      </header>
      {landlord !== null && (
        <main>
          <div className="contactLandlord">
            <p className="landlordName">Contact {landlord?.name}</p>
          </div>
          <form className="messageForm">
            <div className="messageDiv">
              <label htmlFor="message" className="messageLabel">
                Message
              </label>
              <textarea
                name="message"
                id="message"
                className="textarea"
                value={message}
                onChange={onChange}
              ></textarea>
            </div>
            <a
              href={`mailto:${landlord.email}?Subject=${searchParams.get(
                'listingName'
              )}&body=${message}`}
            >
              <button className="primaryButton" type="button">
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  );
}

export default Contact;
