import React from 'react';
// React hooks
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Firebase variables and functions to use the database
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db } from '../firebase.config';

// Components to render await and errors
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

// This is to create a unique id for each uploaded listing
import { v4 as uuidv4 } from 'uuid';

function CreateListing() {
  // If you have an APIKEY for the goelocation google API, you need to set the default of this to true
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);

  // loading component state variable
  const [loading, setLoading] = useState(false);

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

  // isMounted prevents memory leaks in case the useEffect gets called when there is no information
  const isMounted = useRef(true);

  // UseEffect is a hooks that gets called everytime a variable in the second parameter [] changes. If the [] is empty, useEffect only gets called when the component is first rendered
  useEffect(() => {
    // Only when the component gets mounted you can check the user auth to display the data
    if (isMounted) {
      onAuthStateChanged(auth, user => {
        // Only if there is a user, the data is displayed, else, it gets redirected.
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate('/sign-in');
        }
      });
    }
    // This avoids memory leaks
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const onMutate = e => {
    // Create a boolean variable for the field.
    // This is because e.target.value returns a string even on booleans
    let boolean = null;
    if (e.target.value === 'true') {
      boolean = true;
    }
    if (e.target.value === 'false') {
      boolean = false;
    }
    // Add the files to the form data if there are any
    if (e.target.files) {
      setFormData(prevState => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    // Add the rest of the inputs (boolean or other types) to the form data
    if (!e.target.files) {
      setFormData(prevState => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  // Function to submit the data and create a listing
  const onSubmit = async e => {
    e.preventDefault();

    // Show Loading Spinner Component
    setLoading(true);

    // First checks to see if information is correct
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

    // Use the geolocation API to get the latitude and longitude (If enabled with the API KEY)
    // This was pending to implement because I didn´t want to put credit card info on google
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

    // This had to be moved because the geolocation API formatted_address doesnt work very well on all cases.
    location = address;

    // Store image in the database to get a downloadable url from the user input
    // 1. Function to store a single image on firebase
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
    // 2. Loop through the images array to upload all the images
    const imgUrls = await Promise.all(
      [...images].map(image => storeImg(image))
    ).catch(err => {
      setLoading(false);
      toast.error('Sorry, something went wrong uploading the images');
    });

    // Add the listing to the Data base
    const formDataCopy = {
      ...formData,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    // Do data clean up for the location, original images and the discounted price
    formDataCopy.location = address;
    delete formDataCopy.address;
    delete formDataCopy.images;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    // Add the listing to the data base using firebase
    const docRef = await addDoc(collection(db, 'listings'), formDataCopy);

    // Once the upload is finished, redirect to the next page
    setLoading(false);
    toast.success('Listing uploaded and saved');
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  if (loading) {
    return <Spinner />;
  }
  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Create a New Listing</p>
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
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateListing;
