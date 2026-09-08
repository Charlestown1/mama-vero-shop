/**
 * Passport configuration for "Continue with Google".
 * We use passport purely to run the OAuth2 handshake; the app itself
 * remains stateless/JWT-based (session is only used transiently during
 * the OAuth redirect flow).
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;

          let user = await User.findOne({ googleId: profile.id });

          if (!user && email) {
            // Link Google sign-in to an existing manually-created account
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
              user.googleId = profile.id;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              name: profile.displayName || 'Google User',
              email: email ? email.toLowerCase() : `${profile.id}@no-email.google`,
              googleId: profile.id,
              role: 'customer',
            });
          }

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
} else {
  console.warn('[Auth] Google OAuth env vars missing - "Continue with Google" is disabled.');
}

module.exports = passport;
