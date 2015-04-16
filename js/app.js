//images are 101x171, but overlap, from resources, find 83 as row interval

//constants
var ROWS = 6,
    COLS = 7,
    TILES_TOP = 10, //for rendering tiles so that entities position better over tile
    TILE_HEIGHT = 171,
    ROW_HEIGHT = 83,
    COL_WIDTH = 101,
    MIN_SPEED = 25,
    MAX_SPEED = 200;

//declaration for global vars
var player,
    allEnemies,
    //activeTiles,
    texts,
    hearts,
    gems,
    stones;

function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min)) + min;
}

var game = (function() {
    //texts for modal window
    var gameBeginText = {
            header:"<h1>Effective JavaScript: Frogger</h1>",
            body:"<p>well, so ya wanna play a game, eh?</p>"
        },
        drownedText = {
            header:"<h1>Drowned</h1>",
            body:"<p>You know you can't swim.</p>"
        },
        timeExpiredText = {
            header:"<h1>Time's up!</h1>",
            body:"<p>Try moving faster, next time.</p>"
        },
        eatenText = {
            header:"<h1>Eaten by a Bug?!</h1>",
            body:"<p>Do be more careful.</p>"
        },
        gameOverText = {
            header:"<h1>Game Over</h1>",
            body:"<p>It's been fun.</p>"
        };

    var level = 1,
        speed = 1,
        lives = 3,
        dirtIx, paused, txtScore, txtLives, tiles = [], activeTiles = [],
        tileMatrix = [],

        initMatrix = function() {
            /*
             * [[[x,y,0], [x,y,0], ... [x,y,0]],
             *  [[x,y,0], [x,y,0], ... [x,y,0]],
             *              ...
             *  [[x,y,0], [x,y,0], ... [x,y,0]]]
             */
            var row, col, arr;
            for (row = 0; row < ROWS; row++) {
                arr = [];
                for (col = 0; col < COLS; col++) {
                    arr.push([col*COL_WIDTH, row*ROW_HEIGHT + TILES_TOP, 0]); //x, y and whether occupied
                    //arr.push([col*COL_WIDTH, row*ROW_HEIGHT, 0]); //x, y and whether occupied
                }
                tileMatrix.push(arr.slice(0));
            }
        },

        reset = function(delay) {
            setTimeout(start, delay);
        },

        //TODO: decide how to manage pause and resume
        pause = function() {
            paused = true;
        },

        resume = function() {
            paused = false;
        },

        start = function() {
            //when player is safe (new level), reposition dirt
            //get newIx for dirt, then retain the x,y of Dirt and
            // take the x,y of the Water at that position, and swap positions
            if (player.state === 'safe') {
                var newIx, posWasWater = [], posWasDirt = [];

                newIx = getRandomInt(1, COLS-1);
                posWasWater.push(activeTiles[newIx].x);
                posWasWater.push(activeTiles[newIx].y);

                for (var i = 1; i < activeTiles.length-1; i++) {
                    if (activeTiles[i] instanceof Dirt) {
                        posWasDirt.push(activeTiles[i].x);
                        posWasDirt.push(activeTiles[i].y);
                        activeTiles[i].x = posWasWater[0];
                        activeTiles[i].y = posWasWater[1];
                    }
                }

                activeTiles[newIx].x = posWasDirt[0];
                activeTiles[newIx].y = posWasDirt[1];

                api.buildStones();
                api.buildEnemies();
            }


            player.setStartPosition();
        },

        api = {
            speed: speed, //overall speed
            tiles: tiles,
            activeTiles: activeTiles,
            paused: paused,
            activeTiles: activeTiles, //TEMP ONLY!! for testing

            init: function() {
                initMatrix();
                console.log('tileMatrix:', tileMatrix);
                this.buildTiles();
                this.buildHearts();
                this.buildTexts();
                this.buildStones();
                player = new Player('images/char-boy.png');
                this.buildEnemies();

                modal.modalIn({
                    header: gameBeginText.header,
                    body: gameBeginText.body
                });
            },

            safe: function() {
                player.state = 'safe';
                texts.level.dynamic = ++level; //parseInt(texts.level.dynamic) + 1;
                reset(500);
            },

            drowned: function() {
                player.state = 'drowned';
                hearts.pop();
                //pause();
                reset(100);

                modal.modalIn({
                    header: drownedText.header,
                    body: drownedText.body
                });

            },

            eaten: function() {
                player.state = 'eaten';
                if (hearts.length) hearts.pop();
                reset(0);

                modal.modalIn({
                    header: eatenText.header,
                    body: eatenText.body
                });

            },

            blocked: function() {
                console.log('blocked');
            },

            buildEnemies: function() {
                allEnemies = []; //each call to buildEnemies refreshes enemies with new array
                //TODO: make some more interesting way of determining how many enemies we have
                console.log('buildEnemies, level:', level);
                var n = (level < 3) ? 3 : 5;
                n = 2;
                for (var i = 0; i < n; i++) {
                    allEnemies.push(new Enemy('images/enemy-bug.png'));
                }
            },

            buildTexts: function() {
                texts = {};
                texts.score = new Text('Score: ', '0', (COLS - 3)*COL_WIDTH, 46);
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

            buildStones: function() {
                stones = [];
                var x, y, count = Math.floor(level/3);

                for (i = 0; i < count; i++) {
                    x = getRandomInt(0, COLS) * COL_WIDTH;
                    y = getRandomInt(1, ROWS-2) * ROW_HEIGHT - TILES_TOP,
                    xDirt = activeTiles[dirtIx].x,
                    yDirt = activeTiles[dirtIx].y;

                    //prevent stone from blocking path to dirt
                    if (!(x === xDirt && y === yDirt - 2 * TILES_TOP + ROW_HEIGHT )) {
                        stones.push(new Stone('images/Rock.png', x, y));
                    }
                }
            },

            buildTiles: function() {
                var row, col, // dirtX,
                    rowImages = [
                    'images/water-block.png',   // Top row is water or dirt
                    'images/stone-block.png',   // Row 1 of 3 of stone
                    'images/stone-block.png',   // Row 2 of 3 of stone
                    'images/stone-block.png',   // Row 3 of 3 of stone
                    'images/grass-block.png',   // Row 1 of 2 of grass
                    'images/grass-block.png'    // Row 2 of 2 of grass
                ];

                //retain index to dirt tile so stone will not be positioned immediately below it
                dirtIx = getRandomInt(1, COLS-1);

                //top row, water and dirt. water is to be avoided, dirt is the destination.
                for (col = 0; col < COLS; col++) {
                    if (col === dirtIx) {
                        //activeTiles.push(new Dirt('images/dirt-block.png', col * COL_WIDTH, TILES_TOP));
                        console.log('tileMatrix[col][0]:',tileMatrix[col][0]);
                        activeTiles.push(new Dirt('images/dirt-block.png', tileMatrix[0][col][0], tileMatrix[0][col][1]));
                    } else {
                        //activeTiles.push(new Water('images/water-block.png', col * COL_WIDTH, TILES_TOP));
                        activeTiles.push(new Water('images/water-block.png', tileMatrix[0][col][0], tileMatrix[0][col][1]));
                    }
                }

                //remaining rows have no behavior
                for (row = 1; row < ROWS; row++) {
                    for (col = 0; col < COLS; col++) {
                        //tiles.push(new Entity(rowImages[row], col * COL_WIDTH, row * ROW_HEIGHT + TILES_TOP));
                        tiles.push(new Entity(rowImages[row], tileMatrix[row][col][0], tileMatrix[row][col][1]));
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

// Water our player must avoid
var Water = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Water.prototype = Object.create(Entity.prototype);
Water.prototype.constructor = Water;

Water.prototype.update = function(dt) {
    //console.log('player:', player);
    if (this.x === player.x && this.y === player.y+TILES_TOP && player.state !== 'drowned') game.drowned();
}

// Dirt is our player's destination
var Dirt = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Dirt.prototype = Object.create(Entity.prototype);
Dirt.prototype.constructor = Dirt;

Dirt.prototype.update = function(dt) {
    if (this.x === player.x && this.y === player.y+TILES_TOP && player.state !== 'safe') game.safe();
}

var Stone = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Stone.prototype = Object.create(Entity.prototype);
Stone.prototype.constructor = Stone;

Stone.prototype.update = function(dt) {
    if ((this.x === player.x) && (this.y+TILES_TOP === player.y)) player.blocked();
}

var Gem = function(img, x, y) {
    Entity.call(this, img, x, y);
    this.rightmost = COLS * COL_WIDTH;
}

Gem.prototype = Object.create(Entity.prototype);
Gem.prototype.constructor = Stone;

Gem.prototype.update = function(dt) {
    //if (this.x+COL_WIDTH >= player.x && this.x <= player.x+COL_WIDTH && this.y+TILES_TOP === player.y && player.state !== 'eaten') game.gemAcquired();
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
    if (this.x+COL_WIDTH >= player.x && this.x <= player.x+COL_WIDTH && this.y+TILES_TOP === player.y && player.state !== 'eaten') game.eaten();
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

    this.state; //managed by player and game
    this.oldX;
    this.oldY;
    this.rightmost = (COLS - 1) * COL_WIDTH;
    this.bottommost = (ROWS - 1) * ROW_HEIGHT;
    this.setStartPosition();
}

Player.prototype = Object.create(Entity.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {
    //Signature here, just one dt?
}

Player.prototype.handleInput = function(k) {
    //console.log('Player.handleInput, k:', k);
    this.oldX = this.x;
    this.oldY = this.y;
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
}

Player.prototype.blocked = function() {
    this.x = this.oldX;
    this.y = this.oldY;
}

Player.prototype.setStartPosition = function() {
    this.state = 'born';
    this.setPosition(getRandomInt(0, COLS)*COL_WIDTH, this.bottommost);
    //console.log('Player.setStartPosition, this:', this);
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
    modal.handleInput(allowedKeys[e.keyCode]);
});


