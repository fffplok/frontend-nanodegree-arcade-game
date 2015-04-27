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
    this.dynamic = dynamic; // || '';
}

Text.prototype = Object.create(Entity.prototype);
Text.prototype.constructor = Text;

Text.prototype.render = function(s) {
    ctx.font = '24px "Averia Libre", cursive'; //danger, need fallback font
    ctx.fillStyle = '#000'; //TODO: choose color
    if (s) console.log('text.render, s:', s);
    ctx.fillText(this.fixed + (s || this.dynamic), this.x, this.y);
}

// Water our player must avoid
var Water = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Water.prototype = Object.create(Entity.prototype);
Water.prototype.constructor = Water;

Water.prototype.update = function(dt) {
    //console.log('player:', player);
    if (this.x === player.x && this.y === player.y && player.state !== 'drowned') game.drowned();
}

// Dirt is our player's destination
var Dirt = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Dirt.prototype = Object.create(Entity.prototype);
Dirt.prototype.constructor = Dirt;

Dirt.prototype.update = function(dt) {
    if (this.x === player.x && this.y === player.y && player.state !== 'safe') game.safe();
}

var Stone = function(img, x, y) {
    Entity.call(this, img, x, y);
}

Stone.prototype = Object.create(Entity.prototype);
Stone.prototype.constructor = Stone;

Stone.prototype.update = function(dt) {
    if ((this.x === player.x) && (this.y === player.y)) player.blocked();
}

var Gem = function(img, x, y, val) {
    Entity.call(this, img, x, y);
    this.state = 'hidden';
    this.alpha = 0;
    this.value = val;
    this.rightmost = COLS * COL_WIDTH;
    this.objAnimate = {
        begin: null,
        duration: 2500
    }

    var setState = function(who, state) {
        who.objAnimate.begin = Date.now();
        who.state = state;
    };

    setTimeout(setState, getRandomInt(500, 5000), this, 'fadeIn');
}

Gem.prototype = Object.create(Entity.prototype);
Gem.prototype.constructor = Gem;

Gem.prototype.render = function() {
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    ctx.globalAlpha = 1;
}

Gem.prototype.update = function(dt) {
    //some easing functions to play with
    // https://gist.github.com/gre/1650294
    // http://gabrieleromanato.name/javascript-implementing-the-fadein-and-fadeout-methods-without-jquery/
    var easing = {
      easeInQuad: function (t) { return t*t },
      easeOutQuad: function (t) { return t*(2-t) },
      easeOutCubic: function (t) { return (--t)*t*t+1 },
      easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
      bounce: function (t) {
            for (var a = 0, b = 1, result; 1; a += b, b /= 2) {
                if (t >= (7 - 4 * a) / 11) {
                    return -Math.pow((11 - 6 * a - 11 * t) / 4, 2) + Math.pow(b, 2);
                }
            }
        }
    };

    switch (this.state) {
        case 'hidden':
            this.alpha = 0;
            break;
        case 'fadeIn':
            var now = Date.now(),
                timeRemaining = now - this.objAnimate.begin,
                progress = timeRemaining / this.objAnimate.duration,
                setState = function(who, state) {
                    who.objAnimate.begin = Date.now();
                    who.state = state;
                };

            if (this.objAnimate.duration - timeRemaining > 0) {
                this.alpha = easing.bounce(progress);
            } else {
                this.state = 'visible';
                setTimeout(setState, getRandomInt(2000, 5000), this, 'fadeOut');
            }
            break;
        case 'fadeOut':
            var now = Date.now(),
                timeRemaining = now - this.objAnimate.begin,
                progress = timeRemaining / this.objAnimate.duration;

            if (this.objAnimate.duration - timeRemaining > 0) {
                this.alpha = 1 - easing.easeInQuad(progress);
            } else {
                this.state = 'hidden';
            }
            break;
        case 'visible':
            this.alpha = 1;
    }

    if (this.x === player.x && this.y === player.y && this.state !== 'hidden') {
        this.value = Math.round(this.value * this.alpha);
        game.gemAcquired(this);
    }

}

// Enemies our player must avoid
var Enemy = function(img, direction, level) {
    Entity.call(this, img);
    //Entity.call(this, img, x, y);
    this.rightmost = COLS * COL_WIDTH;
    this.direction = direction;

    //increase possible speeds by level
    this.setSpeed(1+3*level/100);
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
    //if (this.x > this.rightmost || this.x < 0) this.setStartPosition();
    if (this.direction > 0 && this.x > this.rightmost) {
        this.setStartPosition();
    } else if (this.direction < 0 && this.x < -COL_WIDTH) {
        this.setStartPosition();
    }

    //collision check, player. 16 is visual edge match, 36 overlaps slightly
    if (this.x+COL_WIDTH-36 >= player.x && this.x <= player.x+COL_WIDTH-36 && this.y === player.y && player.state !== 'eaten') game.eaten();

    //TODO: if we have time: collision check, stone.
}

Enemy.prototype.setSpeed = function(level) {
    this.speed = this.direction * getRandomInt(MIN_SPEED, MAX_SPEED);
}

Enemy.prototype.setStartPosition = function() {
    var offset = getRandomInt(1, 4) * COL_WIDTH; //distance for positioning off canvas
    if (this.direction > 0) {
        this.x = offset * -1; //position off canvas left
    } else {
        this.x = offset + this.rightmost; //position off canvas right
    }

    this.y = getRandomInt(1, 5) * ROW_HEIGHT; //position over stone or grass top row
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
    //don't allow movement if game paused or while on dirt tile (short timer set so player can be seen as safe)
    if (game.paused || this.state === 'safe') return;

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
            //console.log('unknown keycode, k:', k);
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

