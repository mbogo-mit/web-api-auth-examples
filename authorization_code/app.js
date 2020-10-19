/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
const path = require('path');
const ejs = require('ejs');
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

var client_id = 'e2667c69d01d4ab1abc854d2feadd7c6'; // Your client id
var client_secret = 'cd543496c21d4acb8f6eed9b4fe27fe6'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();


let store = new MongoDBStore({
  //uri: 'mongodb://localhost:27017/connect_mongodb_session_test_music_app',
  uri: 'mongodb://localhost:27017/connect_mongodb_session_test_music_app',
  collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

app.use(session({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));


app.use(express.json());

app.use(cors())
   .use(cookieParser());


// static files
app.use('/static', express.static(path.join(__dirname, 'public')))

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');  

app.get('/', function(req, res){
  res.render('pages/index');
});

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming app-remote-control';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        req.session.access_token = body.access_token;
        req.session.refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + req.session.access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          req.session.user = body;
          res.render('pages/index2', {user: body});
        });
        /*
        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: req.session.access_token,
            refresh_token: req.session.refresh_token
          }));
        */  
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      req.session.access_token = body.access_token
      res.send({
        'access_token': req.session.access_token
      });
    }
  });
});

app.post('/playlists', function(req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: { 'Authorization': 'Bearer ' + req.session.access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    let responseHTML = "";
    ejs.renderFile('views/partials/playlistscontainer.ejs', {body: body}, {}, function(err, html){
      responseHTML += html;
    });
    res.send({responseHTML: responseHTML});
  });
});
app.get('/playlists/:playlistId/tracks', function (req, res) {
  var options = {
         
    url: `https://api.spotify.com/v1/playlists/${req.params.playlistId}/tracks`,
    headers: { 'Authorization': 'Bearer ' + req.session.access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    //console.log(body.items[0].track);
    res.render('pages/playlistview.ejs',{access_token: req.session.access_token, user: req.session.user, body: body})
  });
})

app.get('/audio-analysis/:SpotifyID', function (req, res) {
  var options = {
         
    url: `https://api.spotify.com/v1/audio-analysis/${req.params.SpotifyID}`,
    headers: { 'Authorization': 'Bearer ' + req.session.access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {

    // now we need to create a datasets object for chart js to render everything we need
    /*
    datasets: [{
					label: 'Dataset with string point data',
					backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
					borderColor: window.chartColors.red,
					fill: false,
					data: [{
						x: newDateString(0),
						y: randomScalingFactor()
					}, {
						x: newDateString(2),
						y: randomScalingFactor()
					}, {
						x: newDateString(4),
						y: randomScalingFactor()
					}, {
						x: newDateString(5),
						y: randomScalingFactor()
					}],
				},.....{...}]
    */

    let color_pitches = [
      "rgb(253, 242, 126)", // yellow
      "rgb(191, 227, 140)",
      "rgb(119, 208, 150)",
      "rgb(108, 209, 205)",
      "rgb(75, 196, 243)",
      "rgb(107, 159, 219)",
      "rgb(131, 123, 197)", // purple
      "rgb(196, 136, 198)",
      "rgb(244, 132, 180)",
      "rgb(244, 127, 136)",
      "rgb(248, 153, 99)",
      "rgb(251, 182, 105)",
    ];

    //console.log(body.segments.length);

    let datasets = [];
    for(let i = 0; i < Math.floor(body.segments.length / 4); i++){
      let min_value = Math.min(...body.segments[i].pitches);
      for(let j = 0; j < body.segments[i].pitches.length; j++){
        if(datasets[j] === undefined){
          datasets[j] = {
            label: `Pitch ${j + 1}`,
            backgroundColor: color_pitches[j],
            borderColor: color_pitches[j],
            fill: false,
            data: [],
            lineTension: 0,
          };
        }
        
        datasets[j].data.push({
          x: body.segments[i].start * 1000,
          //y: body.segments[i].pitches[j] - min_value,
          y: j + 1,
        });
      }
    }

    console.log(datasets)

    res.render('pages/audio-analysis-chart.ejs',{datasets: datasets});
  });
});

app.get('/editor/:SpotifyID', function (req, res) {
  var options = {
         
    url: `https://api.spotify.com/v1/tracks/${req.params.SpotifyID}`,
    headers: { 'Authorization': 'Bearer ' + req.session.access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    console.log(body);
    res.render('pages/editor.ejs',{access_token: req.session.access_token, user: req.session.user, body: body, options_container: OptionsContainer})
  });
});

let OptionsContainer = {
  "lightbulb": {
    effects_tab: {
      color: {
        name: "Color",
        categories: {
          solid_color: {
            name: "Solid Color",
            options: [
              {name: "Color", settings_type: 'solid_color'},
            ],
          },
          gradient: {
            name: "Gradient",
            options: [
              {name: "Gradient", settings_type: 'gradient'},
            ],
          },
        },
      },
      brightness: {
        name: "Brightness",
        categories: {
          constant_brightness: {
            name: "Constant Brightness",
            options: [
              {name: "Constant Brightness", settings_type: 'constant_brightness'},
            ],
          },
          flash_brightness: {
            name: "Flashing",
            options: [
              {name: "Flashing", settings_type: 'flashing_brightness'},
              {name: "Pulse", settings_type: 'pulse_brightness'},
            ],
          },
        },
      }
    },
  },
  "led-strip": {
    effects_tab: {
      colors: {
        name: "Colors",
        categories: {
          solid_color: {
            name: "Colors",
            options: [
              {name: "Colors", settings_type: 'colors'},
            ],
          },
          gradient: {
            name: "Gradients",
            options: [
              {name: "Stationary Gradient", settings_type: 'stationary_gradient'},
              {name: "Moving Gradient", settings_type: 'moving_gradient'}
            ],
          },
          swipe:{
            name: "Swipe",
            options: [
              {name: "Swipe", settings_type: 'swipe'},
              {name: "Collapse Swipe", settings_type: 'swipe_collapse'}
            ],
          },
        },
      },
      brightness: {
        name: "Brightness",
        categories: {
          constant_brightness: {
            name: "Constant Brightness",
            options: [
              {name: "Constant Brightness", settings_type: 'constant_brightness'},
            ],
          },
          flash_brightness: {
            name: "Flashing",
            options: [
              {name: "Flashing", settings_type: 'flashing_brightness'},
              {name: "Pulse", settings_type: 'pulse_brightness'},
            ],
          },
        },
      }
    },
  },
  "led-pillow": {
    effects_tab: {
      "text-graphics": {
        name: "Text/Graphics",
        categories: {
          text: {
            name: "Text",
            options: [
              {name: "A Word", settings_type: 'text_word'},
              {name: "Stream of Text", settings_type: 'text_stream'},
            ],
          },
          emojis: {
            name: "Emojis",
            options: [
              {name: "Happy", settings_type: 'emoji_happy'},
              {name: "Sad", settings_type: 'emoji_sad'},
              {name: "Eggplant", settings_type: 'emoji_eggplant'},
            ],
          },
          shapes: {
            name: "Shapes",
            options: [
              {name: "Square", settings_type: 'shape_square'},
              {name: "Star", settings_type: 'shape_star'},
              {name: "Heart", info: {}},
            ],
          },
        },
      },
      background: {
        name: "Background",
        categories: {
          solid_color: {
            name: "Colors",
            options: [
              {name: "Colors", info: {}},
            ],
          },
          random_background: {
            name: "Random Background",
            options: [
              {name: "Noise", info: {}},
              {name: "Pixels", info: {}},
              {name: "Twinkle", info: {}},
            ],
          },
          gradient: {
            name: "Gradients",
            options: [
              {name: "Stationary Gradient", info: {}},
              {name: "Moving Gradient", info: {}}
            ],
          },
          swipe:{
            name: "Swipe",
            options: [
              {name: "Swipe", info: {}},
              {name: "Collapse Swipe", info: {}},
              {name: "Snake Swipe", info: {}}
            ],
          },
        },
      },
      brightness: {
        name: "Brightness",
        categories: {
          constant_brightness: {
            name: "Constant Brightness",
            options: [
              {name: "Constant Brightness", info: {}},
            ],
          },
          flash_brightness: {
            name: "Flashing",
            options: [
              {name: "Flashing", info: {}},
              {name: "Pulse", info: {}},
            ],
          },
        },
      }
    },
  },
  "led-blanket": {
    effects_tab: {
      "text-graphics": {
        name: "Text/Graphics",
        categories: {
          text: {
            name: "Text",
            options: [
              {name: "A Word", info: {}},
              {name: "Stream of Text", info: {}},
            ],
          },
          emojis: {
            name: "Emojis",
            options: [
              {name: "Happy", info: {}},
              {name: "Sad", info: {}},
              {name: "Eggplant", info: {}},
            ],
          },
          shapes: {
            name: "Shapes",
            options: [
              {name: "Square", info: {}},
              {name: "Start", info: {}},
              {name: "Heart", info: {}},
            ],
          },
        },
      },
      background: {
        name: "Background",
        categories: {
          solid_color: {
            name: "Colors",
            options: [
              {name: "Colors", info: {}},
            ],
          },
          random_background: {
            name: "Random Background",
            options: [
              {name: "Noise", info: {}},
              {name: "Pixels", info: {}},
              {name: "Twinkle", info: {}},
            ],
          },
          gradient: {
            name: "Gradients",
            options: [
              {name: "Stationary Gradient", info: {}},
              {name: "Moving Gradient", info: {}}
            ],
          },
          shape_wallpapers: {
            name: "Shape Wallpapers",
            options: [
              {name: "Stars", info: {}},
              {name: "Hearts", info: {}},
              {name: "Circles", info: {}},
              {name: "Hearts", info: {}},
            ],
          },
          emoji_wallpapers: {
            name: "Emoji Wallpapers",
            options: [
              {name: "Eggplant", info: {}},
              {name: "Purple Devil", info: {}},
              {name: "Happy", info: {}},
              {name: "Sad", info: {}},
            ],
          },
          swipe:{
            name: "Swipe",
            options: [
              {name: "Swipe", info: {}},
              {name: "Collapse Swipe", info: {}},
              {name: "Snake Swipe", info: {}}
            ],
          },
        },
      },
      brightness: {
        name: "Brightness",
        categories: {
          constant_brightness: {
            name: "Constant Brightness",
            options: [
              {name: "Constant Brightness", info: {}},
            ],
          },
          flash_brightness: {
            name: "Flashing",
            options: [
              {name: "Flashing", info: {}},
              {name: "Pulse", info: {}},
            ],
          },
        },
      }
    },
  },
};


console.log('Listening on 8888');
app.listen(8888);
