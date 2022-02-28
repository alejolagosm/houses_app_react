import React from 'react';
// React hooks
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Firebase variables and functions to use the database
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db } from '../firebase.config';

// This is to create a unique id for each uploaded listing
import { v4 as uuidv4 } from 'uuid';

// Components to render await and errors
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

function EditListing() {
  // If you have an APIKEY for the goelocation google API, you need to set the default of this to true
  // es-lint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);

  // State variable
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(null);

  // Creating the state variable that is the form data, which will get converted to a new listing
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 1000,
    discountedPrice: 0,
    images: {},
    latitude: 41,
    longitude: -73,
  });

  // Creating all the variables from the formData to put on the form jsx
  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
  } = formData;

  // Firebase function to get the auth credentials of the user
  const auth = getAuth();
  // Hook to navigate to other pages
  const navigate = useNavigate();
  const params = useParams();

  // isMounted prevents memory leaks in case the useEffect gets called when there is no information
  const isMounted = useRef(true);

  //   UseEffect to redirect if the listing does not belong to the user
  useEffect(() => {
    if (listing && listing.userRef !== auth.currentUser.uid) {
      toast.error('You are not authorized to edit that listing');
      navigate('/');
    }
  });

  // UseEffect hook to fetch the existing listing data
  useEffect(() => {
    setLoading(true);
    const getListing = async () => {
      const docRef = doc(db, 'listings', params.listingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setListing(docSnap.data());
        setFormData({ ...docSnap.data(), address: docSnap.data().location });
        setLoading(false);
      } else {
        navigate('/');
        toast.error('Listing does not exist');
      }
    };
    getListing();
  }, [params.listingId]);

  // UseEffect hook to get userData. Same as the CreateListing Component
  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, user => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate('/sign-in');
        }
      });
    }
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  //   Function to change each variable inside the formData as the user updates the form. Identical to the one in CreateListing Component
  const onMutate = e => {
    let boolean = null;
    if (e.target.value === 'true') {
      boolean = true;
    }
    if (e.target.value === 'false') {
      boolean = false;
    }
    if (e.target.files) {
      setFormData(prevState => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    if (!e.target.files) {
      setFormData(prevState => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  // Function to submit the data and create a listing (Equal to the one in createListing except for the commented parts)
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    if (discountedPrice > regularPrice) {
      setLoading(false);
      toast.error('Discounted price needs to be less than regular price');
      return;
    }
    if (images.length > 6) {
      setLoading(false);
      toast.error('Maximum allowed is 6 images');
      return;
    }
    let geolocation = {};
    let location;
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=PUTVALIDKEYHERE`
      );
      const data = await response.json();
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;
      location =
        data.status === 'ZERO_RESULTS'
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes('undefined')) {
        setLoading(false);
        toast.error('Please enter a correct address');
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }
    location = address;
    const storeImg = async image => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const metadata = {
          contentType: 'image/jpeg',
        };
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, 'images/' + fileName);
        const uploadTask = uploadBytesResumable(storageRef, image, metadata);
        uploadTask.on(
          'state_changed',
          snapshot => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
              default:
                break;
            }
          },
          error => {
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
              resolve(downloadURL);
            });
          }
        );
      });
    };
    const imgUrls = await Promise.all(
      [...images].map(image => storeImg(image))
    ).catch(err => {
      setLoading(false);
      toast.error('Sorry, something went wrong uploading the images');
    });
    const formDataCopy = {
      ...formData,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };
    formDataCopy.location = address;
    delete formDataCopy.address;
    delete formDataCopy.images;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    // Change the listing data in the data base
    const docRef = doc(db, 'listings', params.listingId);
    await updateDoc(docRef, formDataCopy);
    // End of change
    setLoading(false);
    toast.success('Listing uploaded and saved');
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  //   The jsx return is exactly the same as the createListing Component
  if (loading) {
    return <Spinner />;
  }
  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>
      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel"> Sell/Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === 'sale' ? 'formButtonActive' : 'formButton'}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === 'rent' ? 'formButtonActive' : 'formButton'}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>
          <label className="formLabel"> Name</label>
          <input
            type="text"
            id="name"
            className="formInputName"
            value={name}
            onChange={onMutate}
            maxLength="32"
            minLength="8"
            required
          />
          <div className="formRooms flex">
            <div>
              <label className="formLabel"> Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                className="formInputSmall"
                value={bedrooms}
                onChange={onMutate}
                min="1"
                required
              />
            </div>
            <div>
              <label className="formLabel"> Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                className="formInputSmall"
                value={bathrooms}
                onChange={onMutate}
                min="1"
                required
              />
            </div>
          </div>
          <label className="formLabel">Parking</label>
          <div className="formButtons">
            <button
              type="button"
              className={parking ? 'formButtonActive' : 'formButton'}
              id="parking"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              type="button"
              className={parking ? 'formButton' : 'formButtonActive'}
              id="parking"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>
          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              type="button"
              className={furnished ? 'formButtonActive' : 'formButton'}
              id="furnished"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              type="button"
              className={furnished ? 'formButton' : 'formButtonActive'}
              id="furnished"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>
          <label className="formLabel"> Address</label>
          <textarea
            type="text"
            id="address"
            className="formInputAddress"
            value={address}
            onChange={onMutate}
            required
          />
          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel"> Latitude</label>
                <input
                  type="number"
                  id="latitude"
                  className="formInputSmall"
                  value={latitude}
                  onChange={onMutate}
                  required
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  type="number"
                  id="longitude"
                  className="formInputSmall"
                  value={longitude}
                  onChange={onMutate}
                />
              </div>
            </div>
          )}
          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              type="button"
              className={offer ? 'formButtonActive' : 'formButton'}
              id="offer"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              type="button"
              className={offer ? 'formButton' : 'formButtonActive'}
              id="offer"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>
          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              type="number"
              className="formInputSmall"
              id="regularPrice"
              value={regularPrice}
              onChange={onMutate}
              min="100"
              max="100000000"
              required
            />
            {type === 'rent' && <p className="formPriceText">$/month</p>}
          </div>
          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <div className="formPriceDiv">
                <input
                  type="number"
                  className="formInputSmall"
                  id="discountedPrice"
                  value={discountedPrice}
                  onChange={onMutate}
                  min="100"
                  max="100000000"
                  required={offer}
                />
                {type === 'rent' && <p className="formPriceText">$/month</p>}
              </div>
            </>
          )}
          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover of the listing. 6 images maximum
          </p>
          <input
            type="file"
            className="formInputFile"
            id="images"
            onChange={onMutate}
            max="6"
            accept=".jpg,.png,.jpeg"
            multiple
            required
          />
          <button type="submit" className="primaryButton createListingButton">
            Update Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditListing;
