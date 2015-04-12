//images are 101x171, but overlap, from resources, find 83 as row interval

//constants
var ROWS = 6,
    COLS = 6,
    TILES_TOP = 10, //for rendering tiles so that entities position better over tile
    TILE_HEIGHT = 171,
    ROW_HEIGHT = 83,
    COL_WIDTH = 101,
    MIN_SPEED = 25,
    MAX_SPEED = 200;

//declaration for global vars
var player,
    allEnemies,
    texts,
    hearts,
    gems,
    stones;

function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min)) + min;
}

var game = (function() {
    var level = 0,
        tiles = [],
        speed = 1,
        lives = 3,
        txtScore, txtLives,
        api = {
            speed: speed, //overall speed
            tiles: tiles,

            init: function() {
                this.buildTiles();
                this.buildHearts();
                this.buildTexts();
                this.buildEnemies();
                player = new Player('images/char-boy.png');
                this.setPlayerStart();

                modal.modalIn({
                    header:"<h1>Effective JavaScript: Frogger</h1>",
                    body:"<p>well, so ya wanna play a game, eh?</p>"
                });
            },

            setPlayerStart: function() {
                player.setPosition(getRandomInt(0, COLS)*COL_WIDTH, player.bottommost);
            },

            buildEnemies: function() {
                allEnemies = []; //each call to buildEnemies refreshes enemies with new array
                //TODO: make some more interesting way of determining how many enemies we have
                var n = (level < 5) ? 1 : 5;
                for (var i = 0; i < n; i++) {
                    allEnemies.push(new Enemy('images/enemy-bug.png'));
                }
            },

            buildTexts: function() {
                texts = {};
                texts.score = new Text('Score: ', 19999, (COLS - 3)*COL_WIDTH, 46);
                texts.level = new Text('Level: ', '0', (COLS - 1)*COL_WIDTH, 46);
                texts.timeRemaining = new Text('Time Remaining: ', '0:00', 0, (ROWS+2)*ROW_HEIGHT-36);
            },

            buildHearts: function() {
                hearts = [];
                var i,
                    x = 10,
                    y = 10,
                    w = 40;
                for (i = 0; i < lives; i++) {
                   hearts.push(new Entity('images/heart-small.png', x, y));
                   x += w;
                }
            },

            buildTiles: function() {
                var row, col, dirtX,
                    rowImages = [
                    'images/water-block.png',   // Top row is water
                    'images/stone-block.png',   // Row 1 of 3 of stone
                    'images/stone-block.png',   // Row 2 of 3 of stone
                    'images/stone-block.png',   // Row 3 of 3 of stone
                    'images/grass-block.png',   // Row 1 of 2 of grass
                    'images/grass-block.png'    // Row 2 of 2 of grass
                ];

                dirtX = getRandomInt(1, COLS-1);

                //make sure there is a color over the canvas
                //ctx.fillStyle = '#dadad0';
                //ctx.fillRect(0, 0, COLS * COL_WIDTH, ROWS * ROW_HEIGHT + TILE_HEIGHT);

                for (row = 0; row < ROWS; row++) {
                    for (col = 0; col < COLS; col++) {
                        if (row === 0 && col === dirtX) {
                            tiles.push(new Entity('images/dirt-block.png', col * COL_WIDTH, row * ROW_HEIGHT + TILES_TOP));
                        } else {
                            tiles.push(new Entity(rowImages[row], col * COL_WIDTH, row * ROW_HEIGHT + TILES_TOP));
                        }
                    }
                }
            }
        };

    return api;
})();

//All objects placed on the canvas may be a subclass of Entity.
// each object has a sprite and x and y position. Each object can be rendered.
var Entity = function(img, x, y) {
    this.sprite = img;
    this.x = x || 0;
    this.y = y || 0;
};

Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Entity.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
}

var Text = function(fixed, dynamic, x, y) {
    Entity.call(this, null, x, y);
    this.fixed = fixed;
    this.dynamic = dynamic || '';
}

Text.prototype = Object.create(Entity.prototype);
Text.prototype.constructor = Text;

Text.prototype.render = function() {
    ctx.font = '24px "Averia Libre", cursive'; //danger, need fallback font
    ctx.fillStyle = '#000'; //TODO: choose color
    ctx.fillText(this.fixed + this.dynamic, this.x, this.y);
}

// Enemies our player must avoid
var Enemy = function(img, x, y) {
    Entity.call(this, img, x, y);
    this.rightmost = COLS * COL_WIDTH;

    this.setSpeed();
    this.setStartPosition();
}

Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.constructor = Enemy;


// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += dt * this.speed * game.speed;
    if (this.x > this.rightmost) this.setStartPosition();

    //console.log('player:', player);
    if (this.x+COL_WIDTH >= player.x && this.x <= player.x+COL_WIDTH && this.y+TILES_TOP === player.y) console.log('collision!');
}

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

Enemy.prototype.setSpeed = function() {
    this.speed = getRandomInt(MIN_SPEED, MAX_SPEED);
}

Enemy.prototype.setStartPosition = function() {
    this.x = getRandomInt(1, 4) * COL_WIDTH * -1; //off canvas to left
    this.y = getRandomInt(1, 4) * ROW_HEIGHT - TILES_TOP; //any of the stone block tiled rows
}


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

//GG - Player does not need to have prototypal inheritance as there
// is only one instance. Begin by copying Enemy, later may implement
// module pattern.
var Player = function(img) {
    Entity.call(this, img);

    this.rightmost = (COLS - 1) * COL_WIDTH;
    this.bottommost = (ROWS - 1) * ROW_HEIGHT;
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {
    //Signature here, just one dt?
}

Player.prototype.handleInput = function(k) {
    //console.log('Player.handleInput, k:', k);
    switch(k) {
        case 'up':
            //y must be between 0 and 405 (83 x number of rows-1), y offset is -10
            if (this.y >= ROW_HEIGHT) this.y -= ROW_HEIGHT;
            break;
        case 'down':
            if (this.y < this.bottommost) this.y += ROW_HEIGHT;
            break;
        case 'left':
            //x must be between 0 and 404 (101 x number of cols-1)
            if (this.x >= COL_WIDTH) this.x -= COL_WIDTH;
            break;
        case 'right':
            if (this.x < this.rightmost) this.x += COL_WIDTH;
            break;
        default:
            console.log('unknown keycode, k:', k);
    }
    //Signature here?

/*
    //testing only
    if (hearts.length) {
        hearts.pop();
    }
*/
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

//jQuery ready...
$(function() {
    modal.init();
    game.init();
    //console.log('jQuery ready, modal:', modal);

    //modal.button.on('click', modal.modalOut);
    //var player = new Player('images/char-boy.png');
    //buildEnemies(3);

});


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
    console.log('modal:',modal);
    modal.handleInput(allowedKeys[e.keyCode]);
});
