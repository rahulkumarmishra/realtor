const bcrypt = require('bcrypt');
const db = require('../../models');
const helper = require('../../helper/helper');
const salt = 10;
const { Op, Sequelize } = require('sequelize');
module.exports = {

    login: async (req, res) => {
        try {
            res.render('auth/login', { msg: req.flash('msg') });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    login_post: async (req, res) => {
        try {
            const { email, password } = req.body;

            const checkUser = await db.users.findOne({
                where: {
                    role: 0,
                    email
                },
                raw: true,
                nest: true
            });

            if (!checkUser) {
                req.flash('msg', 'Invalid Email.');
                return res.redirect('/login');
            }

            const compairPassword = await bcrypt.compare(password, checkUser.password);

            if (!compairPassword) {
                req.flash('msg', 'Invalid password.');
                return res.redirect('/login');
            }

            req.session.user = checkUser;
            req.flash('msg', 'login successfully');
            return res.redirect('/dashboard');

        } catch (error) {
            console.log(error);
        }
    },

    dashboard: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect("/login");
            const users = await db.users.findAll({ where: { role: 1 } });
            const userCount = users.length;
            const activeUser = users.filter(user => user.status === 1).length;
            const inActiveUser = users.filter(user => user.status === 0).length;

            const services = await db.services.count();
            const requests = await db.requests.count();

            const requestList = await db.requests.findAll({
                include: [
                    {
                        attributes: ['id', 'name'],
                        model: db.users
                    },
                    {
                        attributes: ['id', 'title'],
                        model: db.properties
                    }
                ],
                where: {
                    status: {
                        [Op.ne]: 2
                    }
                }
            });

            const totalAmount = requestList.reduce((total, amount) => total + Number(amount.total_amount), 0)

            // Garph data

            const totalEarnings = await db.requests.findAll({
                attributes: [
                    [db.sequelize.fn('month', db.sequelize.col('createdAt')), 'month'],
                    [db.sequelize.fn('sum', db.sequelize.col('total_amount')), 'totalEarnings'],
                ],
                group: [db.sequelize.fn('month', db.sequelize.col('createdAt'))],
                raw: true,
            });

            res.render('auth/dashboard', { msg: req.flash('msg'), title: 'dashboard', userCount, services, requests, activeUser, inActiveUser, totalEarnings, totalAmount });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    profile: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const id = global.adminData.id;
            const adminData = await db.users.findByPk(id)
            const timing = await db.admin_timing.findOne({ where: { user_id: id }, raw: true, nest: true });

            res.render('auth/profile', { msg: req.flash('msg'), title: 'dashboard', adminData, timing });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    editProfile: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const id = global.adminData.id;
            const adminData = await db.users.findByPk(id)
            const timing = await db.admin_timing.findOne({ where: { user_id: id }, raw: true, nest: true });
            res.render('auth/edit_profile', { msg: req.flash('msg'), title: 'dashboard', adminData, timing });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    updateProfile: async (req, res) => {
        try {

            if (!req.session.user) return res.redirect('/login');
            const id = global.adminData.id;

            if (req.files) {
                var image = await helper.fileUploader(req.files.image, '/uploads');
            }

            const updateAdminUser = await db.users.update({
                name: req.body.name,
                mobile: req.body.mobile,
                image: image ? image.name : global.adminData.image,
                location: req.body.location
            }, {
                where: { id }
            });

            const updateTime = await db.admin_timing.update({
                start_time: req.body.start_time,
                end_time: req.body.end_time
            }, {
                where: { user_id: id }
            });

            if (!updateAdminUser) {
                req.flash('msg', 'Unable to update profile');
                return res.redirect('/profile/edit');
            }

            const userData = await db.users.findByPk(id);

            req.session.user = userData;
            req.flash('msg', 'Profile updated successfully');
            return res.redirect('/profile');

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    changePassword: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            res.render('auth/change_password', { msg: req.flash("msg"), title: 'dashboard' });

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    updatePassword: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const { old_password, new_password } = req.body;
            const id = global.adminData.id;
            const adminUser = await db.users.findByPk(id);

            if (!adminUser) {
                req.flash('msg', 'Something went wrong');
                return res.redirect('/password/change')
            }

            const compairPassword = await bcrypt.compare(old_password, adminUser.password);

            if (!compairPassword) {
                req.flash('msg', 'Invalid old password');
                return res.redirect('/password/change')
            }

            const bcryptedPassword = await bcrypt.hash(new_password, salt);

            const changePassword = await db.users.update({
                password: bcryptedPassword
            }, {
                where: { id }
            });

            if (!changePassword) {
                req.flash("msg", "Unable to change password");
                return res.redirect('/password/change');
            }

            req.flash("msg", "Password has been changed successfully");
            return res.redirect('/login');

        } catch (error) {
            console.log(error);
            res.render('error500');
        }
    },

    logout: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect("/login");
            req.flash("msg", "Logout successfully");
            res.redirect('/login');
            await new Promise(resolve => setTimeout(resolve, 2000));
            const adminLogout = req.session.destroy();
        } catch (error) {
            console.log(error);
        }
    },

    notificationStatus: async (req, res) => {
        try {
            const notificationStatus = await db.notifications.update({
                status: 1
            }, {
                where: { reciver_id: global.adminData.id, status: 0 }
            });

            res.json(notificationStatus);
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    }

}