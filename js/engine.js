/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

//GG note. there is no point in declaring a variable Engine here. It remains undefined because the closure doesn't return anything.
var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime,
        running = false;

    canvas.width = COLS * COL_WIDTH; //707; //505;
    canvas.height = ROWS * ROW_HEIGHT + TILE_HEIGHT; // - ROW_HEIGHT; // //606;
    doc.body.appendChild(canvas);

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        running = true;
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */

        if (!game.paused) {
            update(dt);
            render();
        }

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    };

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        //console.log('game:',game);
        reset();
        lastTime = Date.now();

        //main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        updateEntities(dt);
        // checkCollisions();
    }

    /* This is called by the update function  and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to  the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        game.activeTiles.forEach(function(tile){
            tile.update();
        });
        stones.forEach(function(stone) {
            stone.update();
        })
        gems.forEach(function(gem) {
            gem.update(dt);
        })
        player.update();
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */
    function render() {
        //fill so any moving images over transparency don't leave a trail
        ctx.fillStyle = '#dadad0';
        ctx.fillRect(0, 0, COLS * COL_WIDTH, ROWS * ROW_HEIGHT + TILE_HEIGHT);

        renderBoard();
        renderEntities();
    }

    /* GG let's leave open the possibility that the board will change. game exposes the tiles array, each tile
     * is an instance of Entity and will render itself.
     */
    function renderBoard() {
        game.activeTiles.forEach(function(tile) {
            tile.render();
        });
        game.tiles.forEach(function(tile) {
            tile.render();
        });
    }

    /* This function is called by the render function and is called on each game
     * tick. It's purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function you have defined.
         */
        for (var text in texts) {
            texts[text].render();
        }
        hearts.forEach(function(heart) {
            heart.render();
        });
        stones.forEach(function(stone){
            stone.render();
        });
        gems.forEach(function(gem){
            gem.render();
        });
        player.render();
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });

    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        // noop
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/dirt-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/rock.png',
        'images/heart.png',
        'images/heart-small.png',
        'images/gem-blue.png',
        'images/gem-green.png',
        'images/gem-orange.png'
    ]);

    Resources.onReady(init);
    //Resources.onReady(game.init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developer's can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;

    //GG note. if we wanted a variable Engine, we need to return something
    return {
        main: main,
        running: running
    }
})(this);
