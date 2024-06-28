const express = require('express');
const router = express.Router();
const helper = require('../helper/helper');
const authenticateHeader = require('../helper/checkHeaderKeys').authenticateHeader;
const authenticateToken = helper.authenticateToken;

const authController = require('../controller/api/authApiController');
const propertyController = require('../controller/api/propertiesApiController');
const requestController = require('../controller/api/requestApiController');
const settingController = require('../controller/api/settingApiController');
const cardController = require('../controller/api/cardApiController');

// ******************************* Auth *************************

router.post('/login', authenticateHeader, authController.login);
router.post('/signup', authenticateHeader, authController.signup);
router.post('/verify-otp', authenticateHeader, authenticateToken, authController.verifyOtp);
router.post('/resend-otp', authenticateHeader, authenticateToken, authController.resendOtp);
router.post('/logout', authenticateHeader, authenticateToken, authController.logout);
router.post('/profile', authenticateHeader, authenticateToken, authController.logout);

// ******************************* Properties *************************
router.post('/add-property', authenticateHeader, authenticateToken, propertyController.addProperty);
router.post('/update-property', authenticateHeader, authenticateToken, propertyController.updateProperty);
router.get('/property-list', authenticateHeader, authenticateToken, propertyController.propertyList);
router.post('/property-details', authenticateHeader, authenticateToken, propertyController.propertyDetails);
router.post('/get-property', authenticateHeader, authenticateToken, propertyController.getPropertyDetails);
router.post('/delete-property', authenticateHeader, authenticateToken, propertyController.deleteProperty);
router.post('/delete-image', authenticateHeader, authenticateToken, propertyController.deleteImage);

// ******************************* Requests *************************
router.post('/add-request', authenticateHeader, authenticateToken, requestController.addRequest);
router.get('/current-request', authenticateHeader, authenticateToken, requestController.currentRequest);
router.get('/past-request', authenticateHeader, authenticateToken, requestController.pastRequest);
router.post('/request-details', authenticateHeader, authenticateToken, requestController.requestDetails);
router.post('/request-activites', authenticateHeader, authenticateToken, requestController.requestActivites);
router.post('/rating', authenticateHeader, authenticateToken, requestController.addRatings);
router.get('/profile', authenticateHeader, authenticateToken, authController.userProfile);
router.get('/reviews', authenticateHeader, authenticateToken, requestController.reviewListing);
router.post('/review-details', authenticateHeader, authenticateToken, requestController.reviewDetails);
router.post('/review-update', authenticateHeader, authenticateToken, requestController.updateReview);
router.post('/complate-mark', authenticateHeader, authenticateToken, requestController.complateMark);

// ******************************* Settings *************************
router.post('/update-notification', authenticateHeader, authenticateToken, settingController.notification);
router.post('/cms', authenticateHeader, settingController.cms);
router.post('/contact-us', authenticateHeader, authenticateToken, settingController.contactUs);
router.get('/notifications', authenticateHeader, authenticateToken, settingController.notificationList);

// ******************************* Cards *************************
router.post('/add-card', authenticateHeader, authenticateToken, cardController.addCard);
router.get('/cards', authenticateHeader, authenticateToken, cardController.cardList);

module.exports = router;