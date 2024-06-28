var express = require('express');
var router = express.Router();

const authController = require('../controller/admin/authController');
const userController = require('../controller/admin/userController');
const cmsController = require('../controller/admin/cmsController');
const contactUsController = require('../controller/admin/contactUsController');
const serviceController = require('../controller/admin/serviceController');
const requestController = require('../controller/admin/requestController');
const earningController = require('../controller/admin/earningController');
const chatController = require('../controller/admin/chatController');


// ******************* Auth ************************

router.get('/login', authController.login);
router.post('/login_post', authController.login_post);

router.get('/profile', authController.profile);
router.get('/profile/edit', authController.editProfile);
router.post('/profile/update', authController.updateProfile);

router.get('/password/change', authController.changePassword);
router.post('/password/update', authController.updatePassword);
router.post('/notificationStatus', authController.notificationStatus);

router.get('/logout', authController.logout);

// ******************************* Dashboard *************************
router.get('/dashboard', authController.dashboard);

// ******************************* Users *************************
router.get('/users', userController.userListing);
router.post("/status", userController.userStatus);
router.get('/users/view/:id', userController.userView);
router.get('/user/property/:id', userController.propertyList);
router.get('/user/property-view/:id', userController.propertyView);

// ******************************* CMS *************************
router.get('/about', cmsController.about);
router.post('/about-update', cmsController.aboutUpdate);

router.get('/privacy', cmsController.privacy);
router.post('/privacy-update', cmsController.privacyUpdate);

router.get('/term', cmsController.term);
router.post('/term-update', cmsController.termUpdate);

// ******************************* Contact Us *************************
router.get('/contact-us', contactUsController.contactUsList);
router.get('/contact-us/:id', contactUsController.contactUsView);

// ******************************* Services *************************
router.get('/service/list', serviceController.serviceListing);
router.get('/service/add', serviceController.addService);
router.post('/interest-add', serviceController.addServicePost);
router.get('/service/edit/:id', serviceController.editService);
router.post('/service/delete/:id', serviceController.deleteService);
router.post('/service-update', serviceController.serviceUpdate);
router.post("/service-status", serviceController.serviceStatus);

// ******************************* Requests *************************
router.get('/request/list', requestController.requestList);
router.get('/request/view/:id', requestController.viewRequest);
router.get('/rating/:id', requestController.viewRating);
router.post('/request-status', requestController.requestStatus);
router.post('/upload-doc', requestController.uploadDoc);
router.post('/remove-file', requestController.removeFile);


// ******************************* Earning *************************
router.get('/earning/list', earningController.earningList);
router.post('/filter-earning', earningController.filterEarning);

// ******************************* Chat *************************
router.get('/chat', chatController.chatPage);
router.post('/getChat', chatController.getChat);

module.exports = router;
