//images are 101x171, but overlap, from resources, find 83 as row interval
//I wanted to position images nicely over tiles: tried an offset but didn't like the extra scripting required, so republished images to line up as desired without programmatic offsets

//constants
var ROWS = 6,
    COLS = 7,
    TILE_HEIGHT = 171,
    ROW_HEIGHT = 83,
    COL_WIDTH = 101,
    MIN_SPEED = 25,
    MAX_SPEED = 200,
    FACTOR_ENEMY = 5,
    TIME_ALLOWED = 120000, //milliseconds
    GEM_INFO = {
        blue: {
            image: 'images/gem-blue.png',
            value: 10
        },
        green: {
            image: 'images/gem-green.png',
            value: 30
        },
        orange: {
            image: 'images/gem-orange.png',
            value: 100
        }
    };


//declaration for global vars
var player,
    allEnemies = [],
    //activeTiles,
    texts,
    hearts = [],
    gems = [],
    stones = [],
    dTime = 0,
    curTimeAllowed = TIME_ALLOWED,
    idGameInterval;

function getRandomInt(min, max) {
   return Math.floor(Math.random() * (max - min)) + min;
}

//the function passed to setTimeout to count down time allowed.
function updateTime(start) {
    var now = Date.now();
    dTime = now - start;
    game.displayRemainingTime();
    if (!hearts.length) game.livesExpired();
    if (dTime >= curTimeAllowed) {
        clearInterval(idGameInterval);
        curTimeAllowed = TIME_ALLOWED;
        dTime = 0;
        game.timeExpired();
    }
}
//"<p>well, so ya wanna play a game, eh?</p><p>&larr;&#9664;&rarr;&#9654;&uarr;&#9650;&darr;&#9660;</p>"<p>well, so ya wanna play a game, eh?</p>
var game = (function() {
    //texts for modal window
    var gameBeginText = {
            header:"<h1>Effective JavaScript: Frogger</h1>",
            body:"<div class='col-left'>So you want to play a game, eh?<br>Move this guy around by using your arrow keys (&#9664; &#9654; &#9650; &#9660;):</div><div class='col-right'><img src='images/char-boy.png' alt='player'></div><div class='col-left'>Before time runs out, collect as many of these as you can... wait for it! They may not appear immediately:</div><div class='col-right'><img src='images/gem-blue.png' alt='gem'><img src='images/gem-green.png' alt='gem'><img src='images/gem-orange.png' alt='gem'></div><div class='col-left'>You'll need to amble around these:</div><div class='col-right'><img src='images/rock.png' alt='stone'></div><div class='col-left'>And beware the hungry bugs:</div><div class='col-right'><img src='images/enemy-bug.png' alt='bug'><img src='images/enemy-bug-reverse.png' alt='bug'></div><div class='col-left'>Oh! And to continue the game be sure to head to dry land. You cannot swim. Good luck!</div><div class='col-right'><img src='images/dirt-block.png' alt='dirt'><img src='images/water-block.png' alt='water'></div>"

        },
        drownedText = {
            header:"<h1>Nearly drowned!</h1>",
            body:"<p>You know you can't swim.</p>"
        },
        timeExpiredText = {
            header:"<h1>Time's up!</h1>",
            body:"<p>Try moving faster, next time.</p>"
        },
        livesExpiredText = {
            header:"<h1>You died!</h1>",
            body:"<p>So sad. But you can try again.</p>"
        },
        eatenText = {
            header:"<h1>Nearly eaten by a Bug?!</h1>",
            body:"<p>Do be more careful.</p>"
        },
        gameOverText = {
            header:"<h1>Game Over</h1>",
            body:"<p>It's been fun.</p>"
        };

    var level = 1,
        score = 0,
        scoreTemp = 0,
        speed = 1,
        lives = 3,
        paused = true,
        factorEnemy = FACTOR_ENEMY,
        dirtIx, txtScore, txtLives, tiles = [], activeTiles = [],
        tileMatrix = [],
        initMatrix = function() {
            /*
             * [[[x,y,null], [x,y,null], ... [x,y,null]],
             *  [[x,y,null], [x,y,null], ... [x,y,null]],
             *              ...
             *  [[x,y,null], [x,y,null], ... [x,y,null]]]
             */
            var row, col, arr;
            for (row = 0; row < ROWS; row++) {
                arr = [];
                for (col = 0; col < COLS; col++) {
                    //x, y and whether occupied, occupied by what
                    arr.push([col*COL_WIDTH, row*ROW_HEIGHT, null]);
                }
                tileMatrix.push(arr.slice(0));
            }
        },

        resetMatrix = function() {
            var row, col;
            for (row = 0; row < ROWS; row++) {
                for (col = 0; col < COLS; col++) {
                    tileMatrix[row][col][2] = null; //set occupied to null
                }
            }
        },

        matrixFull = function() {
            var row, col, doOuterLoop = true; full = true;
            for (row = 0; doOuterLoop && row < ROWS; row++) {
                for (col = 0; col < COLS; col++) {
                    if (!(tileMatrix[row][col][2] instanceof Entity)) {
                        full = false;
                        doOuterLoop = false;
                        break;
                    }
                }
            }
            return full;
        },

        getGemType = function() {
            var gem, rand = Math.floor(Math.random() * 1000);

            //roughly, we get blue 65%, green 25%, orange 10% of the time
            if (rand <= 50 || rand >= 950) {
                gem = GEM_INFO.orange;
            } else if (rand > 175 && rand < 825) {
                gem = GEM_INFO.blue;
            } else {
                //((rand > 50 && rand <= 175) || (rand < 950 && rand >= 825))
                gem = GEM_INFO.green;
            }

            return gem;
        },

        //reset allows for a delay before restarting the game
        reset = function(delay) {
            setTimeout(start, delay);
        },

        start = function() {
            console.log('game.start(), player.state:', player.state);
            //when player is safe (new level), reposition dirt
            //get newIx for dirt, then retain the x,y of Dirt and
            // take the x,y of the Water at that position, and swap positions
            if (player.state === 'safe') {
                var newIx, posWasWater = [], posWasDirt = [];

                resetMatrix();

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
                api.buildGems();
                api.buildEnemies();
            }

            //restarting. scoreTemp again 0
            scoreTemp = 0;
            //update score. if eaten by bug after getting temporary points, temp points are lost.
            texts.score.dynamic = score;
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
                //console.log('tileMatrix:', tileMatrix);
                this.buildTiles();
                this.buildHearts();
                this.buildTexts();
                this.buildStones();
                this.buildGems();
                this.buildEnemies();
                player = new Player('images/char-boy.png');
                this.displayRemainingTime();

                modal.modalIn({
                    header: gameBeginText.header,
                    body: gameBeginText.body
                });
            },

            safe: function() {
                player.state = 'safe';
                score += scoreTemp;
                texts.score.dynamic = score;

                texts.level.dynamic = ++level;
                reset(500);
            },

            timeExpired: function() {
                score = scoreTemp = 0;
                level = 1;
                curTimeAllowed = TIME_ALLOWED;
                dTime = 0;
                factorEnemy = FACTOR_ENEMY;
                //updateTime(Date.now());
                this.displayRemainingTime();
                texts.level.dynamic = level;

                this.buildHearts();
                this.buildStones();
                this.buildGems();
                this.buildEnemies();

                //player.state = 'timedout';
                console.log('game.timeExpired')
                reset(100);
                modal.modalIn({
                    header: timeExpiredText.header,
                    body: timeExpiredText.body
                });
            },

            livesExpired: function() {
                console.log('livesExpired');
                score = scoreTemp = 0;
                level = 1;
                curTimeAllowed = TIME_ALLOWED;
                dTime = 0;
                factorEnemy = FACTOR_ENEMY;
                //updateTime(Date.now());
                this.displayRemainingTime();
                texts.level.dynamic = level;

                this.buildHearts();
                this.buildStones();
                this.buildGems();
                this.buildEnemies();

                //reset(100);
                modal.modalIn({
                    header: livesExpiredText.header,
                    body: livesExpiredText.body
                });
            },

            drowned: function() {
                player.state = 'drowned';
                hearts.pop();
                reset(100);

                //penalty for drowning... reduce interval before new enemy introduced
                --factorEnemy;

                if (hearts.length) {
                    modal.modalIn({
                        header: drownedText.header,
                        body: drownedText.body
                    });
                } else {
                    this.livesExpired();
                }
            },

            eaten: function() {
                player.state = 'eaten';
                if (hearts.length) hearts.pop();
                reset(0);

                //penalty for being eaten... reduce interval before new enemy introduced
                --factorEnemy;

                if (hearts.length) {
                    modal.modalIn({
                        header: eatenText.header,
                        body: eatenText.body
                    });
                } else {
                    this.livesExpired();
                }
            },

            gemAcquired: function(gem) {
                scoreTemp += gem.value;
                texts.score.dynamic = score + scoreTemp;

                console.log('game.gemAcquired, scoreTemp:', scoreTemp);
                var ixGem;
                for (var i = 0; i < gems.length; i++) {
                    if (gems[i] === gem) ixGem = i;
                }
                delete gems.splice(ixGem, 1);
            },

            //TEMP:
            getTileMatrix: function() {
                return tileMatrix;
            },
            //END TEMP

            blocked: function() {
                console.log('blocked');
            },

            initTimer: function() {
                var now = Date.now();
                idGameInterval = window.setInterval(updateTime, 1000, now);
            },

            displayRemainingTime: function() {
                //console.log('displayRemainingTime, dTime, curTimeAllowed: ', dTime, curTimeAllowed);
                var mins, sTime,
                    secs = Math.ceil((curTimeAllowed - dTime)/1000),
                    formatter = function(n) {
                        var s = (n < 10) ? '0' + n : '' + n;
                        return s;
                    };

                mins = formatter(Math.floor(secs/60));
                secs = formatter(secs % 60);
                sTime = mins + ':' + secs;

                texts.timeRemaining.dynamic = sTime;
            },

            pause: function() {
                curTimeAllowed = curTimeAllowed - dTime;
                dTime = 0;
                clearInterval(idGameInterval);
                this.paused = true;
            },

            resume: function() {
                this.paused = false;
                this.initTimer();
            },

            buildEnemies: function() {
                console.log('buildEnemies, level:', level);
                //take out the trash... immediately free memory of enemy objects
                while (allEnemies.length-1 >= 0) {
                    delete allEnemies.pop();
                }

                //start with 2 enemies. add another every 5th level up
                console.log('buildEnemies, factorEnemy:', factorEnemy);
                var n = Math.floor(level/factorEnemy)+2;

                //reuse getGemType to get lower probability of reverse direction bug
                var dir, img;
                for (var i = 0; i < n; i++) {
                    dir = (getGemType() === GEM_INFO.blue) ? -1 : 1;
                    if (getGemType() === GEM_INFO.green) {
                        dir = -1;
                        img = 'images/enemy-bug-reverse.png';
                    } else {
                        dir = 1;
                        img = 'images/enemy-bug.png';
                    }
                    allEnemies.push(new Enemy(img, dir, level));
                }
            },

            buildTexts: function() {
                texts = {};
                texts.score = new Text('Score: ', score, (COLS - 3)*COL_WIDTH, 35);
                texts.level = new Text('Level: ', level, (COLS - 1)*COL_WIDTH, 35);
                texts.timeRemaining = new Text('Time Remaining: ', '00:00', 0, (ROWS+2)*ROW_HEIGHT-45);

                //console.log('buildTexts, texts:', texts);
            },

            buildHearts: function() {
                //hearts = [];
                while (hearts.length) {
                    delete hearts.pop();
                }
                var i,
                    x = 20,
                    y = 5,
                    w = 40;
                for (i = 0; i < lives; i++) {
                   hearts.push(new Entity('images/heart-small.png', x, y));
                   x += w;
                }
            },

            buildStones: function() {
                while (stones.length) {
                    delete stones.pop();
                }
                var x, y, row, col, stoneCount = 0, count = Math.floor(level/3);

                 while (stoneCount < count) {
                    //unlikely, but possible that tiles be covered entirely by objects. ensure program doesn't hang
                    if (matrixFull()) break;

                    x = getRandomInt(0, COLS) * COL_WIDTH;
                    y = getRandomInt(1, ROWS-1) * ROW_HEIGHT;
                    xDirt = activeTiles[dirtIx].x,
                    yDirt = activeTiles[dirtIx].y;
                    row = y/ROW_HEIGHT;
                    col = x/COL_WIDTH;

                    //prevent stone from blocking path to dirt and test using instanceof to look up the prototype chain to see if position in matrix is occupied by Stone or Gem
                    if (!(x === xDirt && y === yDirt + ROW_HEIGHT ) && !(tileMatrix[row][col][2] instanceof Entity)) {
                        stones.push(new Stone('images/rock.png', x, y));
                        tileMatrix[row][col][2] = stones[stones.length-1]; //keep reference to stone
                        stoneCount++;
                    }
                }
            },

            buildGems: function() {
                while (gems.length) {
                    delete gems.pop();
                }
                var x, y, row, col, gemType, gemCount = 0, count = Math.floor(level/4) + 1;

                while (gemCount < count) {
                    //TODO: I don't like running matrixFull. come up with a way of limiting objects on tiles.
                    //unlikely, but possible that tiles be covered entirely by objects. ensure program doesn't hang
                    if (matrixFull()) break;

                    x = getRandomInt(0, COLS) * COL_WIDTH;
                    y = getRandomInt(1, ROWS-1) * ROW_HEIGHT;
                    row = y/ROW_HEIGHT;
                    col = x/COL_WIDTH;

                    //test using instanceof to look up the prototype chain to see if position in matrix is occupied by Stone or Gem
                    if (!(tileMatrix[row][col][2] instanceof Entity)) {
                        gemType = getGemType();
                        gems.push(new Gem(gemType.image, x, y, gemType.value));
                        tileMatrix[row][col][2] = gems[gems.length-1]; //keep reference to gem
                        gemCount++;
                    }
                }
            },

            buildTiles: function() {
                var row, col,
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
                        activeTiles.push(new Dirt('images/dirt-block.png', tileMatrix[0][col][0], tileMatrix[0][col][1]));
                    } else {
                        activeTiles.push(new Water('images/water-block.png', tileMatrix[0][col][0], tileMatrix[0][col][1]));
                    }
                }

                //remaining rows have no behavior
                for (row = 1; row < ROWS; row++) {
                    for (col = 0; col < COLS; col++) {
                        tiles.push(new Entity(rowImages[row], tileMatrix[row][col][0], tileMatrix[row][col][1]));
                    }
                }
            }
        };

    return api;
})();


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


