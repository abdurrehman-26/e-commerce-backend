// middlewares/identifyUserOrGuest.js
import { v4 as uuidv4 } from "uuid";
import { COOKIE_DOAMIN } from "../constants/cookies-config.js";

// Ensure cookieParser is used with a secret in your main app
// app.use(cookieParser(process.env.COOKIE_SECRET));

export const identifyGuest = (req, res, next) => {
  // Step 1: If user is authenticated (via verifyJWT), nothing more to do
  if (req.user) return next();

  // Step 2: If signed guestID cookie is already set, use it
  const signedGuestID = req.signedCookies?.guestID;
  if (signedGuestID) {
    req.guestID = signedGuestID;
    return next();
  }

  // Step 3: No signed guestID cookie — generate one
  const guestID = uuidv4();

  // Step 4: Set the signed, secure guestID cookie
  res.cookie("guestID", guestID, {  
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,                  // Can't be accessed via JavaScript
    secure: true,                    // Only over HTTPS
    domain: COOKIE_DOAMIN,
    sameSite: "none",  
  });

  req.guestID = guestID;
  next();
};
