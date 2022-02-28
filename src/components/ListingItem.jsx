import React from 'react';
import { Link } from 'react-router-dom';

import { ReactComponent as DeleteIcon } from '../assets/svg/deleteIcon.svg';
import { ReactComponent as EditIcon } from '../assets/svg/editIcon.svg';

import bedIcon from '../assets/svg/bedIcon.svg';
import bathtubIcon from '../assets/svg/bathtubIcon.svg';

// Listing item component
function ListingItem({ listing, id, onDelete, onEdit }) {
  // jsx return for the component usign a list item
  return (
    <li className="categoryListing">
      <Link
        to={`/category/${listing.type}/${id}`}
        className="categoryListingLink"
      >
        <img
          src={listing.imgUrls[0]}
          alt="listing.name"
          className="categoryListingImg"
        />
        <div className="categoryListingDetails">
          <p className="categoryListingLocation">{listing.location}</p>
          <p className="categoryListingName">{listing.name}</p>
          <p className="categoryListingPrice">
            $
            {listing.offer
              ? listing.discountedPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : listing.regularPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            {listing.type === 'rent' && '/month'}
          </p>
          <div className="categoryListingInfoDiv">
            <img src={bedIcon} alt="bedrooms" />
            <p className="categoryListingInfoText">
              {listing.bedrooms} Bedroom{listing.bedrooms > 1 && `s`}
            </p>
            <img src={bathtubIcon} alt="bathrooms" />
            <p className="categoryListingInfoText">
              {listing.bathrooms} Bathroom{listing.bathrooms > 1 && `s`}
            </p>
          </div>
        </div>
      </Link>
      {onDelete && (
        <DeleteIcon
          className="removeIcon"
          fill="rgb(231,76,60)"
          onClick={() => onDelete(listing.id, listing.name)}
        />
      )}
      {onEdit && (
        <EditIcon
          className="editIcon"
          fill="rgb(231,76,60)"
          onClick={() => onEdit(listing.id, listing.name)}
        />
      )}
    </li>
  );
}

export default ListingItem;
