export class Guid {

    static New() {
        var g = new Guid();

        return g.getGuid();
    }

    private S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    private getGuid() {
        // then to call it, plus stitch in '4' in the third group
        return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" 
            + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    }
};