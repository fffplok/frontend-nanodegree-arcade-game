var modal = (function() {
        var button, modal, bkg, header, body, footer;

        //constants identifying css animation
        var MODAL_IN = 'fadeIn',
            MODAL_OUT = 'fadeOut',
            DIALOG_IN = 'rollIn',
            DIALOG_OUT = 'rollOut',
            HIDDEN = 'hidden';

        var api = {

            init: function() {
                //ensure modalOut has the correct 'this'. use $.proxy
                button = $('#onward').on('click', $.proxy(this.modalOut, this));
                modal = $('.modal');
                dialog = $('.modal-dialog');
                bkg = $('.modal-bkg');
                header = $('.modal-header');
                body = $('.modal-body');
                footer = $('.modal-footer');
            },

            handleInput: function(k) {
                //console.log('Modal.handleInput, k, this: ',k, this);
                if (modal.hasClass(MODAL_IN)) {
                    if (k === 'enter') this.modalOut();
                }
            },

            //remove classes specifying css animation
            cleanCSS: function() {
                if (modal.hasClass(MODAL_IN)) modal.removeClass(MODAL_IN);
                if (dialog.hasClass(DIALOG_IN)) dialog.removeClass(DIALOG_IN);
                if (modal.hasClass(MODAL_OUT)) modal.removeClass(MODAL_OUT);
                if (dialog.hasClass(DIALOG_OUT)) dialog.removeClass(DIALOG_OUT);
            },

            modalIn: function(objContent) {
                this.cleanCSS();

                header.html(objContent.header);
                body.html(objContent.body);

                //apply classes for css animation
                modal.addClass(MODAL_IN);
                dialog.removeClass(HIDDEN).addClass(DIALOG_IN);

                game.pause();
            },

            modalOut: function() {
                if (modal.hasClass(MODAL_OUT)) return; //prevent click of hidden button

                this.cleanCSS();

                //first time in main loop needs to be started
                if (!Engine.running) {
                    Engine.main();
                }

                game.resume();

                //apply classes for css animation
                modal.addClass(MODAL_OUT);
                dialog.addClass(DIALOG_OUT);
            }
        }
    return api;
})();
