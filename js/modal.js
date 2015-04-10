var modal = (function() {
/*        var button = document.getElementById('onward'),
        modal = document.querySelector('.modal'),
        bkg = document.querySelector('.modal-bkg'),
        header = document.querySelector('.modal-header'),
        body = document.querySelector('.modal-body'),
        footer = document.querySelector('.modal-footer'),
*/
        var button, modal, bkg, header, body, footer;

        //constants identifying css animation
        var MODAL_IN = 'fadeIn',
            MODAL_OUT = 'fadeOut',
            DIALOG_IN = 'rollIn',
            DIALOG_OUT = 'rollOut',
            HIDDEN = 'hidden';

        var api = {
            //TEMP ONLY - test the selection of elements
            // modal: modal,
            // button: button,
            // bkg: bkg,
            // header: header,
            // body: body,
            // footer: footer,

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
            },

            modalOut: function() {
                console.log('modal.modalOut, this, game: ', this, game);

                this.cleanCSS();

                //TODO: what happens here depends on the state of the game
                Engine.main();

                //apply classes for css animation
                modal.addClass(MODAL_OUT);
                dialog.addClass(DIALOG_OUT);
            }
        }
    return api;
})();
