/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var keyFile = require('../../keyFile'),
    request = require('request'),
    jwt = require ('jwt-simple')

module.exports = {
	login: function (req,res){
        res.redirect(keyFile.authUrl);
    },
    callback: function (req,res){
        authCode = req.allParams().code;
        
        var options = {
            method: 'POST',
            url: 'https://' + keyFile.domain +'/oauth/token',
            headers: { 
                'content-type': 'application/json'
            },
            body:JSON.stringify({
                grant_type: 'authorization_code',
                client_id: keyFile.clientId,
                client_secret: keyFile.clientSecret,
                code: authCode,
                redirect_uri: keyFile.callbackUrl,
                json: true,
            }),
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            body = JSON.parse(body)
            
            if (body.error){
                return res.serverError()
            }

            //Get info on user
            user_info = jwt.decode(body.id_token,'',true)

            req.session.loggedIn = true;
            req.session.user_info = user_info;

            res.redirect("/")

        });
    },
    logout: function (req,res){
        req.session.user_info = {}
        req.session.loggedIn = false;
        res.redirect(keyFile.logoutUrl)
    }
};

