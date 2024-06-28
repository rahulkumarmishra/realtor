const db = require("../../models");

module.exports = {

    about: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const about = await db.cms.findOne({
                where: { id: '1' }
            })
            res.render('cms/about', { msg: req.flash('msg'), title: 'about', about });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    aboutUpdate: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const updatePrivacy = await db.cms.update({
                description: req.body.content
            }, {
                where: { id: req.body.id }
            })

            if (!updatePrivacy) {
                req.flash('msg', 'Unable to update about us.');
                return res.redirect('/about');
            }

            req.flash('msg', 'About us updated successfully.');
            return res.redirect('/about');

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    privacy: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const privacy = await db.cms.findOne({
                where: { id: '2' }
            })
            res.render('cms/privacy', { msg: req.flash('msg'), title: 'privacy', privacy });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    privacyUpdate: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const updatePrivacy = await db.cms.update({
                description: req.body.content
            }, {
                where: { id: req.body.id }
            })

            if (!updatePrivacy) {
                req.flash('msg', 'Unable to update privacy policy.');
                return res.redirect('/privacy');
            }

            req.flash('msg', 'Privacy policy updated successfully.');
            return res.redirect('/privacy');

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    term: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            const term = await db.cms.findOne({
                where: { id: '3' }
            })
            res.render('cms/term', { msg: req.flash('msg'), title: 'term', term });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

    termUpdate: async (req, res) => {
        try {
            if (!req.session.user) return res.redirect('/login');

            const updateTerm = await db.cms.update({
                description: req.body.content
            }, {
                where: { id: req.body.id }
            })

            if (!updateTerm) {
                req.flash('msg', 'Unable to update terms & conditions.');
                return res.redirect('/term');
            }

            req.flash('msg', 'Terms & Conditions updated successfully.');
            return res.redirect('/term');

        } catch (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        }
    },

}