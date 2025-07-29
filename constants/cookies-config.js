const COOKIE_DOAMIN = process.env.COOKIE_DOAMIN

if (!COOKIE_DOAMIN) {
  throw new Error("Cookie Domain env variable not set.")
}

export {
  COOKIE_DOAMIN
}
