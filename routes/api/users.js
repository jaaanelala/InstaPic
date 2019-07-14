const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');




// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
  User.findOne({email: req.body.email})
    .then(user => {
      if (user) {
        return res.status(400).json({
          email: 'Email already exists'
        })
      } else {
        const avatar = gravatar.url(req.body.email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) throw err;
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });

      }
    })
    .catch(err => console.log(err));
})

// @route   POST api/users/login
// @desc    Login user
// @access  Public
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //Find user by email
  User.findOne({email})
    .then(user => {
      if (!user){
        return res.status(404).json({
          email: 'User not found'
        });
      }

      //Check for password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
          //User matched
          const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          };

          //Sign a token
          jwt.sign(
            payload, 
            keys.secretOrKey,
            {expiresIn: 3600},
            (err, token) => {
              return res.json({
                success: true,
                token: 'Bearer ' + token
              });
            }
          );
        }
        else {
          return res.status(400).json({password: 'Password incorrect'}); 
        }
    })
    .catch(err => console.log(err));
  });
});
// @route   GET api/users/current user
// @desc    Return current user
// @access  Private
router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
  res.json({msg: 'Success'});
})


module.exports = router;

