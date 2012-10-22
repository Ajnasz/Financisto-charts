/*global YUI: true*/
YUI.add('node++', function NodePP(Y) {
    function showBlock() {
        this.setStyle('display', 'block');
    }

    Y.Node.addMethod('showBlock', showBlock);

    Y.NodeList.importMethod(Y.Node.prototype, 'showBlock');
}, {requires: ['node']});


