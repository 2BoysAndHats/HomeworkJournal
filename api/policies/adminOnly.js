/**
 * adminOnly
 *
 * @module      :: Policy
 * @description :: Only allows an admin (me!) to pass.
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */

admins = [
    'cbrowne17@ballymakennycollege.ie',
]

module.exports = function(req, res, next) {

  // User is allowed, proceed to the next policy, 
  // or if this is the last policy, the controller
  if (admins.includes(req.session.user_info.name)) {
    return next();
  }

  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  return res.forbidden()
};
